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
import * as decoding from "lib0/decoding";
import * as encoding from "lib0/encoding";

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
  const [isBootstrapping, setIsBootstrapping] = useState(false);
  const bootstrapMinElapsedRef = useRef(false);
  const [bootstrapTick, setBootstrapTick] = useState(0);
  const [isDirty, setIsDirty] = useState(false);
  const imageInputRef = useRef(null);
  const timerRef = useRef(null);
  const initCheckTimerRef = useRef(null);
  const bootstrapTimerRef = useRef({ min: null, max: null });
  const hasInitializedFromDbRef = useRef(false);
  const userColorRef = useRef(getRandomColor());
  const lastSavedContentRef = useRef(null);
  const lastYdocUpdateAtRef = useRef(0);

  const [provider, setProvider] = useState(null);
  const [ydoc, setYdoc] = useState(null);
  const wsBatchRef = useRef({
    ws: null,
    originalSend: null,
    pending: [],
    timer: null,
  });

  // 1. WebSocket 连接逻辑
  useEffect(() => {
    if (!isShared) {
      setProvider(null);
      setYdoc(null);
      hasInitializedFromDbRef.current = false;
      setIsBootstrapping(false);
      bootstrapMinElapsedRef.current = false;
      return;
    }

    if (!docId || !currentUserId) return;

    const token = localStorage.getItem("token");
    if (!token) {
      setStatus("disconnected");
      return;
    }

    setIsBootstrapping(true);
    bootstrapMinElapsedRef.current = false;
    lastYdocUpdateAtRef.current = Date.now();
    const newYdoc = new Y.Doc();
    const newProvider = new WebsocketProvider(
      "ws://localhost:8080/ws",
      docId.toString(),
      newYdoc,
      { params: { userId: currentUserId.toString(), token } }
    );

    let statusTimer;
    newProvider.on("status", (event) => {
      clearTimeout(statusTimer);
      statusTimer = setTimeout(() => {
      setStatus(event.status);
      }, 0);
    });

    // 监听 WebSocket 的关闭事件，判断是否是被踢出
    const handleWsClose = (event) => {
      if (event.code === 4000 && event.reason === "KICKED_OUT") {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        alert('您的账号已在其他地方登录，您被迫下线。');
        window.location.href = '/';
      }
    };

    // 轮询检查 ws 实例并绑定 close 事件（因为 y-websocket 会在断线后重建 ws）
    let wsCheckInterval = setInterval(() => {
      if (newProvider.ws && !newProvider.ws.hasKickedOutListener) {
        newProvider.ws.addEventListener("close", handleWsClose);
        newProvider.ws.hasKickedOutListener = true;
      }
    }, 1000);

    setYdoc(newYdoc);
    setProvider(newProvider);
    hasInitializedFromDbRef.current = false;

    return () => {
      clearInterval(wsCheckInterval);
      clearTimeout(statusTimer);
      clearTimeout(bootstrapTimerRef.current.min);
      clearTimeout(bootstrapTimerRef.current.max);
      newProvider.destroy();
      newYdoc.destroy();
      setIsBootstrapping(false);
      bootstrapMinElapsedRef.current = false;
    };
  }, [docId, isShared, currentUserId]);

  useEffect(() => {
    if (!isShared || !provider) return;

    const batch = wsBatchRef.current;
    const flushWindowMs = 80;
    const maxBatchSize = 10;

    const toUint8Array = (data) => {
      if (data instanceof Uint8Array) return data;
      if (data instanceof ArrayBuffer) return new Uint8Array(data);
      if (ArrayBuffer.isView(data)) {
        return new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
      }
      return null;
    };

    const decodeUpdate = (u8) => {
      const decoder = decoding.createDecoder(u8);
      decoding.readVarUint(decoder);
      decoding.readVarUint(decoder);
      return decoding.readVarUint8Array(decoder);
    };

    const encodeUpdateMessage = (update) => {
      const encoder = encoding.createEncoder();
      encoding.writeVarUint(encoder, 0);
      encoding.writeVarUint(encoder, 2);
      encoding.writeVarUint8Array(encoder, update);
      return encoding.toUint8Array(encoder);
    };

    const flush = () => {
      if (!batch.ws || batch.ws.readyState !== WebSocket.OPEN) return;
      if (!batch.originalSend) return;
      if (!batch.pending.length) return;
      const merged =
        batch.pending.length === 1
          ? batch.pending[0]
          : Y.mergeUpdatesV2(batch.pending);
      batch.pending = [];
      const msg = encodeUpdateMessage(merged);
      batch.originalSend(msg);
    };

    const scheduleFlush = () => {
      if (batch.timer) return;
      batch.timer = setTimeout(() => {
        batch.timer = null;
        flush();
      }, flushWindowMs);
    };

    const patchWsSendIfReady = () => {
      const ws = provider.ws;
      if (!ws || ws.readyState !== WebSocket.OPEN) return;
      if (batch.ws === ws && batch.originalSend) return;

      if (batch.ws && batch.originalSend) {
        batch.ws.send = batch.originalSend;
      }
      if (batch.timer) {
        clearTimeout(batch.timer);
        batch.timer = null;
      }
      batch.pending = [];

      batch.ws = ws;
      batch.originalSend = ws.send.bind(ws);

      ws.send = (data) => {
        const u8 = toUint8Array(data);
        if (!u8 || u8.length < 2) {
          if (batch.pending.length) flush();
          return batch.originalSend(data);
        }
        const isSyncUpdate = u8[0] === 0 && u8[1] === 2;
        if (!isSyncUpdate) {
          if (batch.pending.length) flush();
          return batch.originalSend(data);
        }
        try {
          const update = decodeUpdate(u8);
          batch.pending.push(update);
          if (batch.pending.length >= maxBatchSize) {
            flush();
          } else {
            scheduleFlush();
          }
        } catch {
          if (batch.pending.length) flush();
          batch.originalSend(data);
        }
      };
    };

    const onStatus = (event) => {
      if (event?.status === "connected") {
        setTimeout(patchWsSendIfReady, 0);
      }
    };

    provider.on("status", onStatus);
    setTimeout(patchWsSendIfReady, 0);

    return () => {
      provider.off?.("status", onStatus);
      if (batch.timer) {
        clearTimeout(batch.timer);
        batch.timer = null;
      }
      if (batch.pending.length) {
        flush();
      }
      if (batch.ws && batch.originalSend) {
        batch.ws.send = batch.originalSend;
      }
      batch.ws = null;
      batch.originalSend = null;
      batch.pending = [];
    };
  }, [isShared, provider]);

  // 2. 编辑器初始化 (必须在任何 return 之前！)
  const editor = useEditor(
    {
      content: isShared ? null : tryParseContent(initialContent),
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

      onCreate: ({ editor }) => {
        if (isShared) return;
        const jsonString = JSON.stringify(editor.getJSON());
        lastSavedContentRef.current = jsonString;
        setIsDirty(false);
      },
      onUpdate: ({ editor }) => {
        if (isShared) return;
        const jsonString = JSON.stringify(editor.getJSON());
        if (jsonString === lastSavedContentRef.current) {
          setIsDirty(false);
          return;
        }
        setIsDirty(true);
        Promise.resolve().then(() => {
          handleDebouncedSave(jsonString);
        });
      },
    },
    [docId, isShared, provider, permissionType]
  );

  useEffect(() => {
    if (!editor) return;
    const isEditable = !isShared || (permissionType !== "VIEWER" && !isBootstrapping);
    editor.setEditable(isEditable);
  }, [editor, isShared, permissionType, isBootstrapping]);

  // 3. 协作状态下：房间为空时由“最小 userId”负责把 document.content 写入 Yjs
  useEffect(() => {
    if (!isShared || !editor || !provider || !ydoc || !currentUserId) return;
    if (!bootstrapMinElapsedRef.current) return;

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
      }, 200);
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
  }, [isShared, editor, provider, ydoc, initialContent, currentUserId, bootstrapTick]);

  useEffect(() => {
    if (!isShared || !editor || !provider || !ydoc) return;
    if (status !== "connected") return;

    let cancelled = false;
    const quietMs = 250;

    const clearTimers = () => {
      clearTimeout(bootstrapTimerRef.current.min);
      clearTimeout(bootstrapTimerRef.current.max);
      bootstrapTimerRef.current.min = null;
      bootstrapTimerRef.current.max = null;
    };

    const finish = () => {
      if (cancelled) return;
      clearTimers();
      setIsBootstrapping(false);
    };

    const checkReady = () => {
      if (cancelled) return;
      if (!bootstrapMinElapsedRef.current) return;
      const fragment = ydoc.getXmlFragment("default");
      const cloudHasContent = fragment.length > 0;
      const dbIsEmpty = !initialContent;
      if (dbIsEmpty) {
        finish();
        return;
      }
      if (!cloudHasContent) return;
      if (Date.now() - lastYdocUpdateAtRef.current >= quietMs) finish();
    };

    clearTimers();
    setIsBootstrapping(true);
    bootstrapMinElapsedRef.current = false;
    bootstrapTimerRef.current.min = setTimeout(() => {
      if (cancelled) return;
      bootstrapMinElapsedRef.current = true;
      setBootstrapTick((t) => t + 1);
      checkReady();
    }, 800);
    bootstrapTimerRef.current.max = setTimeout(finish, 4000);

    const onYdocUpdate = () => {
      lastYdocUpdateAtRef.current = Date.now();
      setTimeout(checkReady, quietMs);
    };
    ydoc.on("update", onYdocUpdate);
    checkReady();

    return () => {
      cancelled = true;
      ydoc.off("update", onYdocUpdate);
      clearTimers();
    };
  }, [isShared, editor, provider, ydoc, status, initialContent]);

  // 防抖保存
  const handleDebouncedSave = useCallback(
    (jsonString) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      setIsSaving(true);
      // 用 microtask 延迟，避免在渲染期间触发状态更新
      timerRef.current = setTimeout(async () => {
        try {
          await onSave(jsonString);
          lastSavedContentRef.current = jsonString;
          setIsDirty(false);
        } finally {
          setIsSaving(false);
        }
      }, 2000);
    },
    [onSave]
  );

  const handleSaveDoc = async () => {
    if (!editor) return;
    if (isShared && (!canManualSave || isBootstrapping)) return;
    if (!isShared && !isDirty) return;
    setIsSaving(true);
    try {
      const jsonString = JSON.stringify(editor.getJSON());
      await onSave(jsonString);
      lastSavedContentRef.current = jsonString;
      setIsDirty(false);
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
          canManualSave={canManualSave && !isBootstrapping}
          hasChanges={isShared ? true : isDirty}
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
        onClick={() => {
          if (isBootstrapping) return;
          editor.chain().focus().run();
        }}
      >
        {isShared && isBootstrapping ? (
          <div className="h-full flex items-center justify-center text-gray-400">
            正在加载协作内容...
          </div>
        ) : (
          <EditorContent editor={editor} />
        )}
      </div>
    </div>
  );
}
