import React from 'react';
import {Share2, Edit, Trash, FolderPlus, Folder, FileText } from 'lucide-react';

export default function ContextMenu({ 
  visible, x, y, 
  targetName, type,
  allowCreate, 
  onCreateFolder, onCreateDoc,
  onShare 
}) {
  if (!visible) return null;

  const isContainer = type === 'root' || type === 'folder';

  return (
    <div
      className="fixed bg-white border border-gray-200 shadow-xl rounded-lg py-1 z-50 w-44 animate-in fade-in duration-100"
      style={{ top: y, left: x }}
      onClick={(e) => e.stopPropagation()} 
    >
      {/* 头部提示：告诉用户当前操作的对象是谁 */}
      <div className="px-4 py-2 text-xs text-gray-400 border-b border-gray-100 mb-1 truncate bg-gray-50 rounded-t-lg">
        {type === 'root' ? '当前位置: 根目录' : `选中: ${targetName}`}
      </div>

      {/* === 场景 1: 右键文档 -> 显示分享 === */}
      {type === 'document' && allowCreate && (
        <button 
          onClick={onShare} 
          className="w-full text-left px-4 py-2 hover:bg-blue-50 text-gray-700 flex items-center gap-2 transition-colors"
        >
          <Share2 size={14} className="text-blue-500"/> 
          邀请协作者
        </button>
      )}
      
      {/* === 场景 2: 右键文件夹或根目录 -> 显示新建 === */}
      {isContainer && allowCreate && (
        <>
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
        </>
      )}
    </div>
  );
}