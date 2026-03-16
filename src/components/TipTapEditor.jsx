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
  } catch {
    return content;
  }
};

export default function TipTapEditor({
  docId,
  initialContent,
  onSave,
  currentUser,
  isShared = false,
  permissionType,
}) {
  const currentUserId = currentUser?.id;
  const currentUserNickname = currentUser?.nickname;
  const canManualSave = !isShared || permissionType === "OWNER" || permissionType === "EDITOR";

  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState("disconnected");
  const imageInputRef = useRef(null);
  const timerRef = useRef(null);
  const initCheckTimerRef = useRef(null);
  const hasInitializedFromDbRef = useRef(false);
  const userColorRef = useRef(getRandomColor());

  const [provider, setProvider] = useState(null);
  const [ydoc, setYdoc] = useState(null);

  // 1. WebSocket 连接逻辑
  useEffect(() => {
    if (!isShared) {
      setProvider(null);
      setYdoc(null);
      hasInitializedFromDbRef.current = false;
      return;
    }

    if (!docId || !currentUserId) return;

    const newYdoc = new Y.Doc();
    const newProvider = new WebsocketProvider(
      "ws://localhost:8080/ws",
      docId.toString(),
      newYdoc,
      { params: { userId: currentUserId.toString() } }
    );

    let statusTimer;
    newProvider.on("status", (event) => {
      clearTimeout(statusTimer);
      statusTimer = setTimeout(() => {
      setStatus(event.status);
      }, 0);
    });

    setYdoc(newYdoc);
    setProvider(newProvider);
    hasInitializedFromDbRef.current = false;

    return () => {
      clearTimeout(statusTimer);
      newProvider.destroy();
      newYdoc.destroy();
    };
  }, [docId, isShared, currentUserId]);

  // 2. 编辑器初始化 (必须在任何 return 之前！)
  const editor = useEditor(
    {
      content: isShared ? null : tryParseContent(initialContent),
      editable: !isShared || permissionType !== "VIEWER",
      extensions: [
        StarterKit.configure({
          history: !isShared,
        }),
        ...BASE_EXTENSIONS,

        isShared && provider && ydoc
          ? Collaboration.configure({ document: ydoc })
          : undefined,

        isShared && provider
          ? CollaborationCursor.configure({
              provider: provider,
              user: {
                name: currentUserNickname || "Unknown",
                color: userColorRef.current,
                id: currentUserId?.toString() || "0",
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
        if (isShared) return;
        Promise.resolve().then(() => {
          handleDebouncedSave(editor.getJSON());
        });
      },
    },
    [docId, isShared, provider, permissionType]
  );

  // 3. 协作状态下：房间为空时由“最小 userId”负责把 document.content 写入 Yjs
  useEffect(() => {
    if (!isShared || !editor || !provider || !ydoc || !currentUserId) return;

    const scheduleInitCheck = () => {
      if (initCheckTimerRef.current) clearTimeout(initCheckTimerRef.current);
      initCheckTimerRef.current = setTimeout(() => {
        if (hasInitializedFromDbRef.current) return;

        const fragment = ydoc.getXmlFragment("default");
        const isCloudEmpty = fragment.length === 0;
        if (!isCloudEmpty) return;

        const states = Array.from(provider.awareness.getStates().values());
        const userIds = states
          .map((s) => Number(s?.user?.id))
          .filter((n) => Number.isFinite(n) && n > 0);
        const myId = Number(currentUserId);
        const minId = userIds.length ? Math.min(...userIds) : myId;

        if (myId !== minId) return;
        if (!initialContent) return;

        const parsedContent = tryParseContent(initialContent);
        editor.commands.setContent(parsedContent);
        hasInitializedFromDbRef.current = true;
      }, 400);
    };

    scheduleInitCheck();

    const onAwarenessChange = () => scheduleInitCheck();
    const onYdocUpdate = () => scheduleInitCheck();

    provider.awareness.on("change", onAwarenessChange);
    ydoc.on("update", onYdocUpdate);

    return () => {
      provider.awareness.off("change", onAwarenessChange);
      ydoc.off("update", onYdocUpdate);
      if (initCheckTimerRef.current) clearTimeout(initCheckTimerRef.current);
    };
  }, [isShared, editor, provider, ydoc, initialContent, currentUserId]);

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
    if (isShared && !canManualSave) return;
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
    event.target.value = '';
    if (!file || !editor) return;
    try {
      const result = await fileService.uploadImage(file);
      if (result.code === 200) {
        editor.chain().focus().setImage({ src: result.data }).run();
      } else {
        alert("图片上传失败: " + (result.msg || "未知错误"));
      }
    } catch {
      alert("图片上传失败");
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
          canManualSave={canManualSave}
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
