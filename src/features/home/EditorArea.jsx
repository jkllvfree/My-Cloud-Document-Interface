import React from "react";
import { FileText } from "lucide-react";
import TipTapEditor from "@/components/TipTapEditor";

export default function EditorArea({
  isShared,
  permissionType,
  selectedDoc,
  docContent,
  docLoading,
  onSaveDoc,
  currentUser,
}) {
  if (docLoading) {
    return (
      <div className="h-full flex items-center justify-center text-gray-400">
        加载文档中...
      </div>
    );
  }

  if (!selectedDoc || selectedDoc.type === "folder") {
    return (
      <div className="flex-1 bg-gray-50 flex flex-col items-center justify-center text-gray-400">
        <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mb-4">
          <FileText size={40} className="text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-600">没有打开的文档</h3>
        <p className="text-sm mt-2">从左侧选择一个文件开始编辑</p>
      </div>
    );
  }

  // 3. ✅ 核心策略分发
  // 这里的 key={...} 非常关键！
  // 当文档切换时，key 的变化会强制 React 销毁旧组件、挂载新组件。
  // 这彻底根除了“状态残留”、“flushSync 报错”以及“内容闪烁”的问题。

  return (
    <TipTapEditor
      key={selectedDoc.id} // 这个 key 千万保留，它是解决报错的最后一道防线
      docId={selectedDoc.id}
      initialContent={docContent}
      onSave={onSaveDoc}
      currentUser={currentUser}
      isShared={isShared}
      permissionType={permissionType}
    />
  );
}
