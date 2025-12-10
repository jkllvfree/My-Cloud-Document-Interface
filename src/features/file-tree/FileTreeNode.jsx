import React, { useState, useEffect, useCallback } from 'react';
import { Folder, FileText, ChevronRight, ChevronDown } from 'lucide-react';
import { folderService } from '@/api/folder';

const FileTreeNode = ({ item, type, onSelectDoc, onNodeContextMenu, refreshTrigger }) => {
  const [expanded, setExpanded] = useState(false);
  const [children, setChildren] = useState({ folders: [], documents: [] });
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  // 加载子节点
  const fetchChildren = useCallback(async () => {
    setLoading(true);
    try {
      const result = await folderService.getContent(item.id);
      if (result.code === 200) {
        setChildren(result.data);
        setLoaded(true);
      }
    } catch (err) {
      console.error("加载文件夹失败", err);
    } finally {
      setLoading(false);
    }
  }, [item.id]);

  // 监听外部刷新信号
  useEffect(() => {
    if (refreshTrigger === item.id) {
      setLoaded(false); // 标记为未加载
      setExpanded(true); // 自动展开
      fetchChildren();   // 重新获取
    }
  }, [refreshTrigger, item.id, fetchChildren]);

  const handleToggle = async (e) => {
    e.stopPropagation();
    if (type === 'document') {
      onSelectDoc(item);
      return;
    }
    if (!expanded && !loaded) {
      await fetchChildren();
    }
    setExpanded(!expanded);
  };

  const handleRightClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (type === 'folder') {
      onNodeContextMenu(e, item);
    }
  };

  const Icon = type === 'folder' ? Folder : FileText;

  return (
    <div className="pl-4 select-none">
      <div
        onClick={handleToggle}
        onContextMenu={handleRightClick}
        className={`flex items-center gap-2 py-1.5 px-2 rounded-md cursor-pointer transition-colors ${
          type === 'document' ? 'hover:bg-blue-50 text-gray-600' : 'hover:bg-gray-200 text-gray-700 font-medium'
        }`}
      >
        {type === 'folder' && (
          <span className="text-gray-400">
            {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </span>
        )}
        <Icon size={16} className={type === 'document' ? 'text-blue-500' : 'text-yellow-500'} />
        <span className="truncate text-sm">{item.name || item.title}</span>
        {loading && <span className="text-xs text-gray-400 ml-auto">加载中...</span>}
      </div>

      {expanded && type === 'folder' && (
        <div className="border-l border-gray-200 ml-3">
          {children.folders.map(folder => (
            <FileTreeNode
              key={`folder-${folder.id}`}
              item={folder}
              type="folder"
              onSelectDoc={onSelectDoc}
              onNodeContextMenu={onNodeContextMenu}
              refreshTrigger={refreshTrigger}
            />
          ))}
          {children.documents.map(doc => (
            <FileTreeNode
              key={`doc-${doc.id}`}
              item={doc}
              type="document"
              onSelectDoc={onSelectDoc}
              onNodeContextMenu={onNodeContextMenu}
              refreshTrigger={refreshTrigger}
            />
          ))}
          {loaded && children.folders.length === 0 && children.documents.length === 0 && (
            <div className="pl-6 py-1 text-xs text-gray-400">（空）</div>
          )}
        </div>
      )}
    </div>
  );
};

export default FileTreeNode;