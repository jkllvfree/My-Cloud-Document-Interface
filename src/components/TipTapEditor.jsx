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

    //定义局部变量存储定时器 ID
    let initTimer;
    let statusTimer;
    let syncTimer;

    newProvider.on("status", (event) => {
      clearTimeout(statusTimer);
      statusTimer = setTimeout(() => {
        setStatus(event.status);
      }, 0);
    });

    newProvider.on("sync", (synced) => {
      clearTimeout(syncTimer);
      syncTimer = setTimeout(() => {
        setIsSynced(synced);
      }, 0);
    });

    initTimer = setTimeout(() => {
      setYdoc(newYdoc);
      setProvider(newProvider);
    }, 0);

    return () => {
      clearTimeout(initTimer);
      clearTimeout(statusTimer);
      clearTimeout(syncTimer);
      newProvider.destroy();
      newYdoc.destroy();
    };
  }, [docId, isShared, currentUser]); // 移除 currentUser 避免频繁重连，除非 ID 变了

  // 2. 编辑器初始化 (必须在任何 return 之前！)
  const editor = useEditor(
    {
      // 协作模式初始给 null (等待同步)，个人模式直接加载
      content: tryParseContent(initialContent) || "",

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
          class:
            "prose prose-slate max-w-none text-base leading-7" +
            " prose-headings:font-bold prose-headings:tracking-tight" +
            " prose-p:my-2 prose-p:leading-relaxed" +
            " prose-img:rounded-xl prose-img:shadow-lg" +
            " prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline focus:outline-none min-h-[500px] p-8",
        },

        handleDOMEvents: {
          click: (view, event) => {
            const isModifierPressed = event.ctrlKey || event.metaKey;

            if (isModifierPressed) {
              const link = event.target.closest("a");

              if (link && link.href) {
                // 1. 核心修复：阻止浏览器的默认聚焦和点击行为
                event.preventDefault();
                event.stopPropagation(); // 防止事件冒泡

                // 2. 打开新窗口
                window.open(link.href, "_blank");

                // 3. 返回 true，告诉 TipTap 编辑器“我处理完了，你不要把光标移过去，也不要选中它”
                return true;
              }
            }
            return false;
          },

          // 建议：增加 mousedown 拦截，防止鼠标按下瞬间产生的聚焦
          mousedown: (view, event) => {
            const isModifierPressed = event.ctrlKey || event.metaKey;
            const link = event.target.closest("a");
            if (isModifierPressed && link) {
              event.preventDefault();
              return true;
            }
            return false;
          },
        },
      },

      onUpdate: ({ editor }) => {
        // if (!isShared) { 无论是否协作，都能触发防抖保存
        // handleDebouncedSave(editor.getJSON());
        // }
        Promise.resolve().then(() => {
          handleDebouncedSave(editor.getJSON());
        });
      },
    },
    //当 provider 变为非空时，useEditor 会重建实例，从而挂载协作插件
    [docId, isShared, provider]
  );

  // 3. 协作状态下的"补全"逻辑
  useEffect(() => {
    if (!isShared || !editor || !provider || !ydoc || !isSynced) return;

    const fragment = ydoc.getXmlFragment("default");

    // 关键：检查 Y.js 文档的实际内容，而不是 JSON
    const isCloudEmpty = fragment.length === 0;

    if (isCloudEmpty && initialContent) {
      console.log("☁️ 协作房间为空，从数据库加载内容到云端...");

      // 解析数据库内容
      const parsedContent = tryParseContent(initialContent);

      // 在 Y.js 事务中写入内容
      ydoc.transact(() => {
        // 临时创建一个编辑器实例来生成 Y.js 节点
        const tempDoc = editor.schema.nodeFromJSON(parsedContent);

        // 方法1：直接用 Collaboration 的 API
        editor.commands.setContent(parsedContent);

        // 如果方法1不行，用方法2：手动操作 Y.js
        // const yXmlFragment = ydoc.getXmlFragment("default");
        // yXmlFragment.delete(0, yXmlFragment.length);
        // editor.commands.setContent(parsedContent);
      }, "init-content");
    } else if (!isCloudEmpty) {
      console.log("👥 协作房间已有内容，自动同步");
    } else {
      console.log("🆕 协作房间和数据库都为空，等待用户输入");
    }

    // 只执行一次
  }, [isShared, isSynced, editor, provider, ydoc, initialContent]);

  // 防抖保存
  const handleDebouncedSave = useCallback(
    (json) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      setIsSaving(true);
      // 用 microtask 延迟，避免在渲染期间触发状态更新
      timerRef.current = setTimeout(async () => {
        try {
          await onSave(JSON.stringify(json));
        } finally {
          setIsSaving(false);
        }
      }, 2000);
    },
    [onSave]
  );

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
    } catch (err) {
      /*...*/
    }
  };

  // ✅ 4. 渲染层的 Loading 判断移到这里 (此时所有 Hooks 都已执行完毕)
  // const isReady = !isShared || (isShared && provider);

  // if (!isReady) {
  //   return (
  //     <div className="p-10 text-center text-gray-400">正在连接协作服务...</div>
  //   );
  // }

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
          onImageClick={() => {
            imageInputRef.current?.click();
          }}
          onSave={handleSaveDoc}
          isSaving={isSaving}
        />
        <div className="flex items-center gap-2 px-2">
          {isShared ? (
            <>
              <span
                className={`w-2 h-2 rounded-full ${
                  status === "connected" ? "bg-green-500" : "bg-red-500"
                }`}
              ></span>
              <span className="text-xs text-gray-500">
                {status === "connected" ? "协作中" : "连接中..."}
              </span>
            </>
          ) : (
            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded">
              个人模式
            </span>
          )}
        </div>
      </div>
      <div
        className="flex-1 overflow-y-auto cursor-text bg-white"
        onClick={() => editor.chain().focus().run()}
      >
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
