import React, { useEffect, useState, useRef, useCallback } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import { EDITOR_EXTENSIONS } from "@/features/editor/extensions"; // 引入配置
import EditorToolbar from "@/features/editor/components/EditorToolbar"; // 引入工具栏
import { fileService } from "@/api/file"; // 引入 API

// 引入协作编辑相关依赖
import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";
import Collaboration from "@tiptap/extension-collaboration";
import CollaborationCursor from "@tiptap/extension-collaboration-cursor";

// 随机颜色生成器（用于光标）
const cursorColors = [
  "#958DF1",
  "#F98181",
  "#FBBC88",
  "#FAF594",
  "#70CFF8",
  "#94FADB",
  "#B9F18D",
];
const getRandomColor = () =>
  cursorColors[Math.floor(Math.random() * cursorColors.length)];

export default function TipTapEditor({
  docId,
  initialContent,
  onSave,
  currentUser,
}) {
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState("connecting"); // connecting | connected | disconnected
  const imageInputRef = useRef(null);

  // 保存 Provider 和 YDoc 实例
  const [provider, setProvider] = useState(null);
  const [ydoc, setYdoc] = useState(null);

  // 1. 初始化 Y.js 连接 (生命周期管理)
  useEffect(() => {
    // 创建文档实例
    const newYdoc = new Y.Doc();
    console.log("准备连接 WebSocket...");
    console.log("URL:", "ws://localhost:8080/ws");
    console.log("Room:", docId);
    console.log("User:", currentUser);

    if (!docId || !currentUser) {
      console.error("❌ 缺少必要参数，停止连接");
      return;
    }

    // 创建 WebSocket 连接
    // 假设后端地址是 ws://localhost:8080/ws/{docId}
    // y-websocket 默认会把 roomName 拼接到 url 后，所以这里 url 填基础路径
    const newProvider = new WebsocketProvider(
      "ws://localhost:8080/ws", // 基础路径
      docId.toString(), // 房间号
      newYdoc,
      { params: { userId: currentUser.userId || currentUser.id } } // 鉴权参数
    );

    //修改部分，检查报错

    newProvider.on("sync", (isSynced) => {
      console.log(">>>> Y.js 同步状态:", isSynced ? "✅ 已同步" : "❌ 未同步");
    });

    // 还可以监听 updates（看看有没有收到别人的数据）
    newProvider.on("update", (update) => {
      console.log(">>>> 收到 Y.js 数据更新，大小:", update.byteLength);
    });

    //到此结束


    newProvider.on("status", (event) => {
      setStatus(event.status);
    });

    

    setYdoc(newYdoc);
    setProvider(newProvider);

    // 清理函数
    return () => {
      newProvider.destroy();
      newYdoc.destroy();
    };
  }, [docId, currentUser?.userId || currentUser?.id]); // 仅在 docId 或用户变化时重连


  
  // 初始化编辑器
  const editor = useEditor(
    {
      extensions: [
        ...EDITOR_EXTENSIONS, // 你的基础配置
        
        // 只有当 provider 和 ydoc 创建好了，才加载协作插件
        provider && ydoc 
          ? Collaboration.configure({
              document: ydoc,
            })
          : undefined,

        // 只有 provider 好了，才加载光标插件
        provider
          ? CollaborationCursor.configure({
              provider: provider,
              user: {
                name: currentUser?.nickname || "匿名用户",
                color: getRandomColor(),
              },
            })
          : undefined,
      ].filter(Boolean), // 过滤掉 undefined

      // ⚠️ 注意：开启协作后，content 属性通常只在第一次加载时有效
      // 后续内容由 Y.js 接管
      // content: initialContent || "",出现了反复渲染，内容双倍的bug，本地和云端“打架”
      content:null,

      editorProps: {
        attributes: {
          class:
            "prose prose-slate max-w-none text-base leading-7 prose-headings:font-bold prose-headings:tracking-tight prose-p:my-2 prose-p:leading-relaxed prose-img:rounded-xl prose-img:shadow-lg prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline focus:outline-none min-h-[500px] p-8",
        },
        handleDOMEvents: {
          click: (view, event) => {
            // 1. 检查是否按下了 Ctrl 键 (Windows) 或 Meta 键 (Mac 的 Command)
            const isModifierPressed = event.ctrlKey || event.metaKey;

            if (isModifierPressed) {
              const link = event.target.closest("a");

              if (link && link.href) {
                // 3. 手动在新标签页打开
                window.open(link.href, "_blank");
                return true; // 阻止编辑器的默认行为
              }
            }
            return false; // 其他情况交给编辑器默认处理
          },
        },
      },

      // 防抖自动保存
      // 每次内容变化，都会触发 update
      onUpdate: ({ editor }) => {
        handleDebouncedSave(editor.getJSON());
      },
    },
    [provider, ydoc]
  );

  // ✅ 推荐方案：添加这个独立的 useEffect

useEffect(() => {
  // 如果 provider 还没准备好，或者没同步，或者编辑器没好，就啥也不干
  if (!provider || !editor || !provider.synced) return;

  // 获取 Y.js 的内容状态
  const fragment = ydoc.getXmlFragment('default');
  const yJsIsEmpty = fragment.toJSON() === '';

  // 只有当 Y.js 真的没数据，且我们手里有数据库旧数据时，才填进去
  if (yJsIsEmpty && initialContent) {
    console.log("检测到 Y.js 为空，执行数据库内容初始化...");
    try {
      const content = typeof initialContent === 'string' 
        ? JSON.parse(initialContent) 
        : initialContent;
      // 这里的 setContent 会触发 Y.js 的更新，从而同步给其他人（这是我们想要的）
      editor.commands.setContent(content);
    } catch (e) {
      editor.commands.setContent(initialContent);
    }
  }
}, [provider, editor, provider?.synced, initialContent]); // 依赖项要写全

  // 防抖保存函数 (使用 useCallback 避免闭包陷阱)
  // 简单的防抖逻辑：在用户停止输入 2 秒后触发保存
  const handleDebouncedSave = useCallback(
    (json) => {
      // 清除上一次的计时器
      if (window.saveTimer) clearTimeout(window.saveTimer);

      setIsSaving(true);
      window.saveTimer = setTimeout(async () => {
        try {
          await onSave(JSON.stringify(json));
        } finally {
          setIsSaving(false);
        }
      }, 2000); // 2秒防抖
    },
    [onSave]
  );

  // 手动保存 (Toolbar 按钮点击)
  const handleManualSave = async () => {
    if (!editor) return;
    setIsSaving(true);
    try {
      await onSave(JSON.stringify(editor.getJSON()));
    } finally {
      setIsSaving(false);
    }
  };


  // 处理图片上传
  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      const result = await fileService.uploadImage(file);
      if (result.code === 200) {
        editor.chain().focus().setImage({ src: result.data }).run();
      } else {
        alert("图片上传失败: " + result.msg);
      }
    } catch (err) {
      console.error(err);
      alert("网络错误");
    } finally {
      event.target.value = ""; // 清空 input
    }
  };

  // 处理保存
  const handleSaveDoc = async () => {
    if (!editor) return;
    setIsSaving(true);
    try {
      const json = editor.getJSON();
      await onSave(JSON.stringify(json));
    } finally {
      setIsSaving(false);
    }
  };

  if (!editor) return null;

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-sm border border-gray-200">
      {/* 隐藏的文件输入框 */}
      <input
        type="file"
        ref={imageInputRef}
        onChange={handleImageUpload}
        className="hidden"
        accept="image/*"
      />

      {/* 独立的工具栏组件 */}
      <EditorToolbar
        editor={editor}
        onImageClick={() => imageInputRef.current?.click()}
        onSave={handleSaveDoc}
        isSaving={isSaving}
      />

      {/* 编辑区域 */}
      <div
        className="flex-1 overflow-y-auto cursor-text bg-white"
        onClick={() => editor.chain().focus().run()}
      >
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
