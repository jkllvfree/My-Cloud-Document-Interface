import React, { useEffect, useState, useCallback, useRef } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import { BASE_EXTENSIONS } from "@/features/editor/extensions";
import EditorToolbar from "@/features/editor/components/EditorToolbar";
import { fileService } from "@/api/file";
import StarterKit from "@tiptap/starter-kit";
import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";
import Collaboration from "@tiptap/extension-collaboration";
import CollaborationCursor from "@tiptap/extension-collaboration-cursor";

const cursorColors = ["#958DF1", "#F98181", "#FBBC88", "#FAF594", "#70CFF8", "#94FADB", "#B9F18D"];
const getRandomColor = () => cursorColors[Math.floor(Math.random() * cursorColors.length)];

const tryParseContent = (content) => {
  try {
    return typeof content === "string" ? JSON.parse(content) : content;
  } catch (e) {
    return content;
  }
};

export default function TipTapEditor({
  docId,
  initialContent,
  onSave,
  currentUser,
  isShared = false,
}) {
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState("disconnected");
  const imageInputRef = useRef(null);
  const timerRef = useRef(null);

  // ✅ 改回 useState，因为 useEditor 需要感知它们的变化来重新配置扩展
  const [provider, setProvider] = useState(null);
  const [ydoc, setYdoc] = useState(null);
  const [isSynced, setIsSynced] = useState(false);

  // 1. WebSocket 连接逻辑
  useEffect(() => {
    if (!isShared) {
      setProvider(null);
      setYdoc(null);
      return;
    }

    if (!docId || !currentUser) return;

    console.log("正在建立 WebSocket 连接...");
    const newYdoc = new Y.Doc();
    const newProvider = new WebsocketProvider(
      "ws://localhost:8080/ws",
      docId.toString(),
      newYdoc,
      { params: { userId: currentUser?.id?.toString() || "0" } }
    );

    newProvider.on("status", (event) => setStatus(event.status));
    newProvider.on("sync", (synced) => setIsSynced(synced));

    // ✅ 更新 State，触发组件重新渲染，从而让下方的 useEditor 拿到 provider
    setYdoc(newYdoc);
    setProvider(newProvider);

    return () => {
      newProvider.destroy();
      newYdoc.destroy();
    };
  }, [docId, isShared, currentUser]); // 移除 currentUser 避免频繁重连，除非 ID 变了

  // 2. 编辑器初始化 (必须在任何 return 之前！)
  const editor = useEditor({
    // 协作模式初始给 null (等待同步)，个人模式直接加载
    content: isShared ? null : tryParseContent(initialContent) || "",

    extensions: [
      StarterKit.configure({
        history: !isShared, 
      }),
      ...BASE_EXTENSIONS,

      // ✅ 依赖 State 中的 provider，只有连接建立后这里才会被添加
      isShared && provider && ydoc
        ? Collaboration.configure({ document: ydoc })
        : undefined,

      isShared && provider
        ? CollaborationCursor.configure({
            provider: provider,
            user: {
              name: currentUser?.nickname || "Unknown",
              color: getRandomColor(),
            },
          })
        : undefined,
    ].filter(Boolean),

    editorProps: {
      attributes: {
        class: "prose prose-slate max-w-none focus:outline-none min-h-[500px] p-8",
      },
    },
    onUpdate: ({ editor }) => {
      if (!isShared) {
        handleDebouncedSave(editor.getJSON());
      }
    },
  }, 
  // ✅ 依赖数组：当 provider 变为非空时，useEditor 会重建实例，从而挂载协作插件
  [docId, isShared, provider]); 

  // 3. 智能注入逻辑
  useEffect(() => {
    if (!isShared || !editor || !provider || !isSynced || !ydoc) return;
    
    // 仅在云端为空时注入初始内容
    const fragment = ydoc.getXmlFragment("default");
    if (fragment.toJSON() === "" && initialContent) {
      console.log("云端无内容，注入本地初始数据");
      editor.commands.setContent(tryParseContent(initialContent));
    }
  }, [isShared, isSynced, editor, initialContent, provider, ydoc]);

  // 防抖保存
  const handleDebouncedSave = useCallback((json) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setIsSaving(true);
    timerRef.current = setTimeout(async () => {
      try {
        await onSave(JSON.stringify(json));
      } finally {
        setIsSaving(false);
      }
    }, 2000);
  }, [onSave]);

  const handleSaveDoc = async () => {
    if (!editor) return;
    setIsSaving(true);
    try {
      await onSave(JSON.stringify(editor.getJSON()));
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleImageUpload = async (event) => {
    // ... 保持你的上传逻辑不变 ...
    const file = event.target.files[0];
    if (!file || !editor) return;
    try {
      const result = await fileService.uploadImage(file);
      if (result.code === 200) {
        editor.chain().focus().setImage({ src: result.data }).run();
      }
    } catch (err) { /*...*/ }
  };

  // ✅ 4. 渲染层的 Loading 判断移到这里 (此时所有 Hooks 都已执行完毕)
  const isReady = !isShared || (isShared && provider);

  if (!isReady) {
    return <div className="p-10 text-center text-gray-400">正在连接协作服务...</div>;
  }

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

      <div className="border-b border-gray-200 bg-gray-50 p-2 flex justify-between items-center">
        <EditorToolbar
          editor={editor}
          onImageClick={() => imageInputRef.current?.click()}
          onSave={handleSaveDoc}
          isSaving={isSaving}
        />
        <div className="flex items-center gap-2 px-2">
          {isShared ? (
            <>
              <span className={`w-2 h-2 rounded-full ${status === "connected" ? "bg-green-500" : "bg-red-500"}`}></span>
              <span className="text-xs text-gray-500">{status === "connected" ? "协作中" : "连接中..."}</span>
            </>
          ) : (
            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded">个人模式</span>
          )}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto cursor-text bg-white" onClick={() => editor.chain().focus().run()}>
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}