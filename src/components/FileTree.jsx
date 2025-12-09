import React, { useState, useEffect } from 'react';
import { Folder, FileText, ChevronRight, ChevronDown } from 'lucide-react';

// === 递归组件：单个节点（可能是文件夹，也可能是文件） ===
const FileTreeNode = ({ item, type, onSelectDoc }) => {
  const [expanded, setExpanded] = useState(false);
  const [children, setChildren] = useState({ folders: [], documents: [] });
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false); // 标记是否已经加载过数据

  // 切换展开/收起
  const handleToggle = async (e) => {
    e.stopPropagation();
    
    // 如果是文档，直接触发选中逻辑，不展开
    if (type === 'document') {
      onSelectDoc(item);
      return;
    }

    // 如果是文件夹
    if (!expanded && !loaded) {
      // 第一次展开，需要去后端拉取数据 (懒加载)
      setLoading(true);
      try {
        // 请求后端接口，currentFolderId 就是当前文件夹的 id
        const res = await fetch(`http://localhost:8080/api/folder/content?currentFolderId=${item.id}`);
        const result = await res.json();
        if (result.code === 200) {
          setChildren(result.data); // data 包含 { folders: [], documents: [] }
          setLoaded(true); // 标记已加载，下次不用再请求
        }
      } catch (err) {
        console.error("加载文件夹失败", err);
      } finally {
        setLoading(false);
      }
    }
    setExpanded(!expanded);
  };

  // 图标选择
  const Icon = type === 'folder' ? Folder : FileText;

  return (
    <div className="pl-4 select-none"> {/* pl-4 实现层级缩进 */}
      
      {/* 这一行是显示的名字 */}
      <div 
        onClick={handleToggle}
        className={`flex items-center gap-2 py-1.5 px-2 rounded-md cursor-pointer transition-colors ${
           type === 'document' ? 'hover:bg-blue-50 text-gray-600' : 'hover:bg-gray-200 text-gray-700 font-medium'
        }`}
      >
        {/* 如果是文件夹，显示小箭头 */}
        {type === 'folder' && (
          <span className="text-gray-400">
            {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </span>
        )}
        
        {/* 文件/文件夹图标 */}
        <Icon size={16} className={type === 'document' ? "text-blue-500" : "text-yellow-500"} />
        
        <span className="truncate text-sm">{item.name || item.title}</span>
        
        {/* loading 转圈圈 */}
        {loading && <span className="text-xs text-gray-400 ml-auto">加载中...</span>}
      </div>

      {/* 子元素区域 (只有文件夹展开时才显示) */}
      {expanded && type === 'folder' && (
        <div className="border-l border-gray-200 ml-3">
          {/* 1. 递归渲染子文件夹 */}
          {children.folders.map(folder => (
            <FileTreeNode 
              key={`folder-${folder.id}`} 
              item={folder} 
              type="folder" 
              onSelectDoc={onSelectDoc} 
            />
          ))}
          
          {/* 2. 递归渲染子文档 */}
          {children.documents.map(doc => (
            <FileTreeNode 
              key={`doc-${doc.id}`} 
              item={doc} 
              type="document" 
              onSelectDoc={onSelectDoc} 
            />
          ))}
          
          {/* 空文件夹提示 */}
          {loaded && children.folders.length === 0 && children.documents.length === 0 && (
            <div className="pl-6 py-1 text-xs text-gray-400">（空）</div>
          )}
        </div>
      )}
    </div>
  );
};

// === 主组件：文件树容器 ===
export default function FileTree({ onSelectDoc }) {
  const [rootContent, setRootContent] = useState({ folders: [], documents: [] });

  // 初始化：加载根目录 (parentId = null)
  useEffect(() => {
    fetch('http://localhost:8080/api/folder/content') // 不传参即为 null
      .then(res => res.json())
      .then(result => {
        if (result.code === 200) {
          setRootContent(result.data);
        }
      });
  }, []);

  return (
    <div className="w-full">
      {/* 根目录下的文件夹 */}
      {rootContent.folders.map(folder => (
        <FileTreeNode 
          key={`folder-${folder.id}`} 
          item={folder} 
          type="folder" 
          onSelectDoc={onSelectDoc} 
        />
      ))}

      {/* 根目录下的文档 */}
      {rootContent.documents.map(doc => (
        <FileTreeNode 
          key={`doc-${doc.id}`} 
          item={doc} 
          type="document" 
          onSelectDoc={onSelectDoc} 
        />
      ))}
    </div>
  );
}