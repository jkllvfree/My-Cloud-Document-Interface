import React, { useEffect, useState, useRef, useMemo } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import { BASE_EXTENSIONS } from "@/features/editor/extensions";
import EditorToolbar from "@/features/editor/components/EditorToolbar";
import { fileService } from "@/api/file";

import StarterKit from '@tiptap/starter-kit';
// === 协作相关依赖 ===
import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";
import Collaboration from "@tiptap/extension-collaboration";
import CollaborationCursor from "@tiptap/extension-collaboration-cursor";

// 光标颜色库
const cursorColors = ["#958DF1", "#F98181", "#FBBC88", "#FAF594", "#70CFF8", "#94FADB", "#B9F18D"];
const getRandomColor = () => cursorColors[Math.floor(Math.random() * cursorColors.length)];

// 🛠️ 辅助函数：安全解析 JSON 内容
const tryParseContent = (content) => {
  try {
    return typeof content === 'string' ? JSON.parse(content) : content;
  } catch (e) {
    return content; // 如果不是JSON，返回原始内容(可能是HTML或纯文本)
  }
};

/**
 * =========================================================================
 * 1. 【单人极速模式】 StandardEditor
 * 适用场景：个人文档 (isShared = false)
 * 特点：无 WebSocket 开销，秒开，绝对稳定
 * =========================================================================
 */
const StandardEditor = ({ initialContent, onSave }) => {
  // 直接初始化，content 设为数据库传来的值
  const editor = useEditor({
    extensions: [
      StarterKit, 
      ...BASE_EXTENSIONS
    ],
    content: tryParseContent(initialContent), // ✅ 核心：直接加载，无需等待
    autofocus: true,
    onUpdate: ({ editor }) => {
      // 可选：这里可以做自动保存防抖，或者单纯依赖工具栏的保存按钮
    },
  });

  // 监听 initialContent 变化 (比如切换文档时)
  useEffect(() => {
    if (editor && initialContent) {
      // 只有当编辑器内容为空，或者明显不一致时才重置，避免打字时被覆盖
      // 由于外层有 key={docId}，切换文档时组件会重建，这里主要是为了防兜底
      if (editor.isEmpty) {
        editor.commands.setContent(tryParseContent(initialContent));
      }
    }
  }, [initialContent, editor]);

  // 复用图片上传逻辑
  const imageInputRef = useRef(null);
  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file || !editor) return;
    try {
      const result = await fileService.uploadImage(file);
      if (result.code === 200) {
        editor.chain().focus().setImage({ src: result.data }).run();
      }
    } catch (err) {
      alert("图片上传失败");
    } finally {
      event.target.value = "";
    }
  };

  if (!editor) return null;

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-sm border border-gray-200">
      <input type="file" ref={imageInputRef} onChange={handleImageUpload} className="hidden" accept="image/*" />
      
      {/* 顶部工具栏 */}
      <div className="border-b border-gray-200 bg-gray-50 p-2 flex justify-between items-center">
        <EditorToolbar editor={editor} onImageClick={() => imageInputRef.current?.click()} />
        <div className="text-xs text-gray-400 px-2">个人模式</div>
      </div>

      {/* 编辑器主体 */}
      <EditorContent editor={editor} className="flex-1 overflow-y-auto p-4" />
    </div>
  );
};

/**
 * =========================================================================
 * 2. 【多人协作模式】 CollaborativeEditor
 * 适用场景：共享文档 (isShared = true)
 * 特点：Y.js + WebSocket，支持多光标同步
 * =========================================================================
 */
const CollaborativeEditor = ({ docId, initialContent, currentUser, onSave }) => {
  const [status, setStatus] = useState("connecting");
  const [isSynced, setIsSynced] = useState(false); // Y.js 是否同步完成
  const imageInputRef = useRef(null);

  // 1. 创建 Y.Doc (保持引用不变)
  const [ydoc] = useState(() => new Y.Doc());

  // 2. 初始化 WebSocket Provider
  const [provider, setProvider] = useState(null);

  useEffect(() => {
    // 创建连接
    const newProvider = new WebsocketProvider(
      "ws://localhost:8080/ws", // 确保你的 WS 地址正确
      docId.toString(),
      ydoc,
      { params: { userId: currentUser?.id?.toString() || "0" } }
    );

    newProvider.on("status", (event) => setStatus(event.status));
    newProvider.on("sync", (synced) => setIsSynced(synced)); // ✅ 关键：监听同步状态

    setProvider(newProvider);

    return () => {
      newProvider.destroy();
    };
  }, [docId, ydoc, currentUser]);

  // 3. 配置 TipTap 编辑器
  const editor = useEditor({
    // ⚠️ 协作模式下 content 必须为 null，等待 Y.js 注入
    content: null, 
    extensions: [
      // ✅ 协作模式：必须关闭 StarterKit 的 history，交给 Collaboration 插件管理
      StarterKit.configure({ history: false }), 
      ...BASE_EXTENSIONS,
      Collaboration.configure({ document: ydoc }),
      CollaborationCursor.configure({
        provider: provider,
        user: {
          // ✅ 确保这里取到了正确的用户名，否则光标上没名字
          name: currentUser?.username || currentUser?.nickname || "用户" + currentUser?.id,
          color: getRandomColor(),
        },
      }),
    ],
  }, [provider]); // 依赖 provider，确保连接建立后才初始化编辑器

  // 4. 【智能注入逻辑】 (修复白屏问题的核心)
  // 只有当：Y.js 同步完成 + 编辑器是空的 + 数据库有内容 时，才注入
  useEffect(() => {
    if (!editor || !provider || !isSynced) return;

    if (editor.isEmpty && initialContent) {
      console.log("🚀 [协作模式] 这是一个新文档(或冷启动)，正在加载数据库存档...");
      try {
        editor.commands.setContent(tryParseContent(initialContent));
      } catch (e) {
        console.error("注入失败", e);
      }
    }
  }, [isSynced, editor, provider, initialContent]);


  // 图片上传逻辑 (同上)
  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file || !editor) return;
    try {
      const result = await fileService.uploadImage(file);
      if (result.code === 200) {
        editor.chain().focus().setImage({ src: result.data }).run();
      }
    } finally {
      event.target.value = "";
    }
  };

  if (!editor) return <div className="p-10 text-center text-gray-400">正在连接协作服务...</div>;

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-sm border border-gray-200">
      <input type="file" ref={imageInputRef} onChange={handleImageUpload} className="hidden" accept="image/*" />

      <div className="border-b border-gray-200 bg-gray-50 p-2 flex justify-between items-center">
        <EditorToolbar editor={editor} onImageClick={() => imageInputRef.current?.click()} />
        {/* 状态指示器 */}
        <div className="flex items-center gap-2 px-2">
          <span className={`w-2 h-2 rounded-full ${status === 'connected' ? 'bg-green-500' : 'bg-yellow-500'}`}></span>
          <span className="text-xs text-gray-500">
            {status === 'connected' ? '协作中' : '连接中...'}
          </span>
        </div>
      </div>

      <EditorContent editor={editor} className="flex-1 overflow-y-auto p-4" />
    </div>
  );
};

/**
 * =========================================================================
 * 3. 【主入口组件】 TipTapEditor
 * 负责分流：根据 isShared 决定渲染哪个子组件
 * =========================================================================
 */
export default function TipTapEditor(props) {
  const { isShared, docId } = props;

  // 使用 key 强制重新渲染：当从 单人->多人 切换时，组件彻底销毁重建，防止状态残留
  // docId 变化时也会重建，保证数据安全
  if (isShared) {
    return <CollaborativeEditor key={`collab-${docId}`} {...props} />;
  } else {
    return <StandardEditor key={`std-${docId}`} {...props} />;
  }
}