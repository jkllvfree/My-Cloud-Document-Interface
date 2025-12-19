import React, { useEffect, useState, useRef, useCallback } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
// ✅ 引入基础插件 (注意：extensions.js 里不要包含 StarterKit)
import { BASE_EXTENSIONS } from "@/features/editor/extensions"; 
import EditorToolbar from "@/features/editor/components/EditorToolbar";
import { fileService } from "@/api/file";

// ✅ 必须单独引入 StarterKit，因为我们要根据模式动态配置它
import StarterKit from '@tiptap/starter-kit'; 

// 协作相关
import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";
import Collaboration from "@tiptap/extension-collaboration";
import CollaborationCursor from "@tiptap/extension-collaboration-cursor";

// 随机颜色
const cursorColors = ["#958DF1", "#F98181", "#FBBC88", "#FAF594", "#70CFF8", "#94FADB", "#B9F18D"];
const getRandomColor = () => cursorColors[Math.floor(Math.random() * cursorColors.length)];

// 解析辅助函数
const tryParseContent = (content) => {
  try {
    return typeof content === 'string' ? JSON.parse(content) : content;
  } catch (e) {
    return content;
  }
};

export default function TipTapEditor({
  docId,
  initialContent,
  onSave,
  currentUser,
  isShared = false, // 🟢 核心参数：默认是单人模式，只有 explicitly 传 true 才是协作
}) {
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState("disconnected");
  const imageInputRef = useRef(null);

  // 保存 Provider 和 YDoc 实例
  const [provider, setProvider] = useState(null);
  const [ydoc, setYdoc] = useState(null);
  const [isSynced, setIsSynced] = useState(false);

  // ============================================================
  // 1. WebSocket 连接逻辑 (仅在 isShared=true 时执行)
  // ============================================================
  useEffect(() => {
    // 🛑 核心分流：单人模式下，彻底切断 WebSocket 连接逻辑
    if (!isShared) {
      setProvider(null);
      setYdoc(null);
      return;
    }

    if (!docId || !currentUser) return;

    // 创建 Y.Doc
    const newYdoc = new Y.Doc();
    
    // 连接 WebSocket
    const newProvider = new WebsocketProvider(
      "ws://localhost:8080/ws",
      docId.toString(),
      newYdoc,
      { params: { userId: currentUser?.id?.toString() || currentUser?.userId || "0" } }
    );

    newProvider.on("status", (event) => setStatus(event.status));
    newProvider.on("sync", (synced) => {
      setIsSynced(synced);
      console.log(">>>> Y.js 同步状态:", synced);
    });

    setYdoc(newYdoc);
    setProvider(newProvider);

    return () => {
      newProvider.destroy();
      newYdoc.destroy();
    };
  }, [docId, currentUser, isShared]); // 👈 依赖 isShared

  // ============================================================
  // 2. 编辑器初始化 (根据模式加载不同配置)
  // ============================================================
  const editor = useEditor({
    // 🟢 核心分流：
    // 单人模式 -> 直接加载 initialContent (秒开)
    // 多人模式 -> 设为 null，等待 Y.js 注入 (防双倍)
    content: isShared ? null : (tryParseContent(initialContent) || ""),

    extensions: [
      // 🟢 核心分流：StarterKit 配置
      isShared 
        ? StarterKit.configure({ history: false }) // 多人：关掉 History (交给 Y.js)
        : StarterKit.configure({ history: true }), // 单人：开启 History (支持撤销)

      ...BASE_EXTENSIONS,

      // 🟢 核心分流：协作插件
      // 只有在 多人模式 + 连接成功 时才加载
      (isShared && provider && ydoc) 
        ? Collaboration.configure({ document: ydoc }) 
        : undefined,

      (isShared && provider)
        ? CollaborationCursor.configure({
            provider: provider,
            user: {
              name: currentUser?.nickname || currentUser?.username || "用户",
              color: getRandomColor(),
            },
          })
        : undefined,
    ].filter(Boolean), // 过滤掉 undefined

    editorProps: {
      attributes: {
        // 防止黑框
        class: "prose prose-slate max-w-none focus:outline-none min-h-[500px] p-8",
      },
      handleDOMEvents: {
        // ✅ 保留你原有的 Ctrl+Click 跳转功能
        click: (view, event) => {
          const isModifierPressed = event.ctrlKey || event.metaKey;
          if (isModifierPressed) {
            const link = event.target.closest("a");
            if (link && link.href) {
              window.open(link.href, "_blank");
              return true;
            }
          }
          return false;
        },
      },
    },
    // 单人模式下的自动保存建议在父组件防抖，或者在这里简单处理
    onUpdate: ({ editor }) => {
       if (!isShared) {
          // 单人模式的逻辑...
       }
    }
  }, [provider, isShared]); // 👈 依赖 provider 和 isShared，变化时重建编辑器

  // ============================================================
  // 3. 智能注入逻辑 (仅在多人模式冷启动时触发)
  // ============================================================
  useEffect(() => {
    // 如果是单人模式，useEditor 里的 content 已经处理了加载，这里无需操作
    if (!isShared) return; 

    if (!editor || !provider || !isSynced) return;

    // 协作模式下：如果编辑器空 + 数据库有内容 -> 注入
    if (editor.isEmpty && initialContent) {
      console.log("🚀 [协作冷启动] 注入数据库存档...");
      editor.commands.setContent(tryParseContent(initialContent));
    }
  }, [isShared, isSynced, editor, provider, initialContent]);


  // ============================================================
  // 4. 其他通用功能 (保留你原有的代码)
  // ============================================================
  
  // 图片上传
  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file || !editor) return;
    try {
      const result = await fileService.uploadImage(file);
      if (result.code === 200) {
        editor.chain().focus().setImage({ src: result.data }).run();
      } else {
        alert("图片上传失败: " + result.msg);
      }
    } catch (err) {
      alert("网络错误");
    } finally {
      event.target.value = "";
    }
  };

  // 保存逻辑
  const handleSaveDoc = async () => {
    if (!editor) return;
    setIsSaving(true);
    try {
      await onSave(JSON.stringify(editor.getJSON()));
    } finally {
      setIsSaving(false);
    }
  };

  if (!editor) return null;

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-sm border border-gray-200">
      <input type="file" ref={imageInputRef} onChange={handleImageUpload} className="hidden" accept="image/*" />
      
      {/* 工具栏区域 */}
      <div className="border-b border-gray-200 bg-gray-50 p-2 flex justify-between items-center">
        <EditorToolbar 
          editor={editor} 
          onImageClick={() => imageInputRef.current?.click()} 
          onSave={handleSaveDoc} 
          isSaving={isSaving} 
        />
        
        {/* 状态指示器 */}
        <div className="flex items-center gap-2 px-2">
           {isShared ? (
              <>
                <span className={`w-2 h-2 rounded-full ${status === 'connected' ? 'bg-green-500' : 'bg-red-500'}`}></span>
                <span className="text-xs text-gray-500">{status === 'connected' ? '协作中' : '连接中...'}</span>
              </>
           ) : (
              <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded">个人模式</span>
           )}
        </div>
      </div>

      {/* 编辑器主体 */}
      <div className="flex-1 overflow-y-auto cursor-text bg-white" onClick={() => editor.chain().focus().run()}>
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}