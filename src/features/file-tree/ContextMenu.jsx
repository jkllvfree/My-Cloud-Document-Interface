import React from 'react';
import { Folder, FileText } from 'lucide-react';

export default function ContextMenu({ visible, x, y, targetName, onCreateFolder, onCreateDoc }) {
  if (!visible) return null;

  return (
    <div
      className="fixed bg-white border border-gray-200 shadow-xl rounded-lg py-1 z-50 w-40 animate-in fade-in duration-100"
      style={{ top: y, left: x }}
      onClick={(e) => e.stopPropagation()} // 防止点击菜单本身触发关闭
    >
      <div className="px-4 py-1 text-xs text-gray-400 border-b border-gray-100 mb-1 truncate">
        在: {targetName}
      </div>
      <button
        onClick={onCreateFolder}
        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
      >
        <Folder size={14} className="text-yellow-500" /> 新建文件夹
      </button>
      <button
        onClick={onCreateDoc}
        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
      >
        <FileText size={14} className="text-blue-500" /> 新建文档
      </button>
    </div>
  );
}