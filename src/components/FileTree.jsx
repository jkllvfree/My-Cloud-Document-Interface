import React, { useState, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react';
import { Folder, FileText, ChevronRight, ChevronDown, Plus, X, Loader2 } from 'lucide-react';

// === 递归组件：单个节点 (保持不变) ===
const FileTreeNode = ({ item, type, onSelectDoc, onNodeContextMenu, refreshTrigger }) => {
  const [expanded, setExpanded] = useState(false);
  const [children, setChildren] = useState({ folders: [], documents: [] });
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false); 

  const fetchChildren = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:8080/api/folder/content?currentFolderId=${item.id}`);
      const result = await res.json();
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

  useEffect(() => {
    if (refreshTrigger && refreshTrigger === item.id) {
      setLoaded(false); 
      setExpanded(true); 
      fetchChildren();
    }
  }, [refreshTrigger, item.id, item.name, fetchChildren]);

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
        <Icon size={16} className={type === 'document' ? "text-blue-500" : "text-yellow-500"} />
        <span className="truncate text-sm">{item.name || item.title}</span>
        {loading && <span className="text-xs text-gray-400 ml-auto">加载中...</span>}
      </div>
      
      {expanded && type === 'folder' && (
        <div className="border-l border-gray-200 ml-3">
          {children.folders.map(folder => (
            <FileTreeNode key={`folder-${folder.id}`} item={folder} type="folder" onSelectDoc={onSelectDoc} onNodeContextMenu={onNodeContextMenu} refreshTrigger={refreshTrigger} />
          ))}
          {children.documents.map(doc => (
            <FileTreeNode key={`doc-${doc.id}`} item={doc} type="document" onSelectDoc={onSelectDoc} onNodeContextMenu={onNodeContextMenu} refreshTrigger={refreshTrigger} />
          ))}
          {loaded && children.folders.length === 0 && children.documents.length === 0 && (
            <div className="pl-6 py-1 text-xs text-gray-400">（空）</div>
          )}
        </div>
      )}
    </div>
  );
};

// === 主组件：文件树容器 ===
// ✨ 修改 1：使用 forwardRef 包裹组件，并接收 ref 参数
const FileTree = forwardRef(({ onSelectDoc, currentUser }, ref) => {
  const [rootContent, setRootContent] = useState({ folders: [], documents: [] });
  
  const [contextMenu, setContextMenu] = useState({ 
    visible: false, x: 0, y: 0, targetId: null, targetName: '根目录' 
  });
  
  const [createTarget, setCreateTarget] = useState({ id: null, name: '根目录' });
  const [refreshNodeId, setRefreshNodeId] = useState(null);

  const [showCreateFolderModal, setShowCreateFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [showCreateDocModal, setShowCreateDocModal] = useState(false);
  const [newDocName, setNewDocName] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const fetchRootContent = () => {
    fetch('http://localhost:8080/api/folder/content') 
      .then(res => res.json())
      .then(result => {
        if (result.code === 200) {
          setRootContent(result.data);
        }
      });
  };

  useImperativeHandle(ref, () => ({
    // ✨ 升级版刷新方法：接收一个 parentId 参数
    refresh: (parentId = null) => {
      if (parentId === null || parentId === 0) {
        // 如果是根目录，直接刷新整个列表
        fetchRootContent();
      } else {
        // 如果是子文件夹，触发 refreshNodeId 机制，精准刷新那个文件夹
        setRefreshNodeId(null); 
        setTimeout(() => setRefreshNodeId(parentId), 50);
      }
    },
    
    triggerRootCreate: (type) => {
      setCreateTarget({ id: null, name: '根目录' });
      if (type === 'folder') setShowCreateFolderModal(true);
      if (type === 'document') setShowCreateDocModal(true);
    }
  }));

  useEffect(() => {
    fetchRootContent();
    const handleClickOutside = () => setContextMenu({ ...contextMenu, visible: false });
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []); 

  const handleGlobalContextMenu = (e) => {
    e.preventDefault();
    setContextMenu({ visible: true, x: e.clientX, y: e.clientY, targetId: null, targetName: '根目录' });
  };

  const handleNodeContextMenu = (e, item) => {
    setContextMenu({ visible: true, x: e.clientX, y: e.clientY, targetId: item.id, targetName: item.name });
  };

  const openModal = (type) => {
    setCreateTarget({ id: contextMenu.targetId, name: contextMenu.targetName });
    setContextMenu({ ...contextMenu, visible: false }); 
    if (type === 'folder') setShowCreateFolderModal(true);
    if (type === 'document') setShowCreateDocModal(true);
  };

  const triggerRefresh = () => {
    if (createTarget.id === null) {
        fetchRootContent();
    } else {
        setRefreshNodeId(null); 
        setTimeout(() => setRefreshNodeId(createTarget.id), 50);
    }
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return alert("文件夹名称不能为空");
    if (!currentUser) return alert("未登录");

    setIsCreating(true);
    try {
      const response = await fetch('http://localhost:8080/api/folder/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'creator_id': currentUser.id.toString() },
        body: JSON.stringify({ name: newFolderName, parentId: createTarget.id })
      });
      const result = await response.json();
      if (result.code === 200) {
        setShowCreateFolderModal(false);
        setNewFolderName("");
        triggerRefresh(); 
      } else {
        alert(result.message || "创建失败");
      }
    } catch (err) { alert("网络错误"); } finally { setIsCreating(false); }
  };

  const handleCreateDocument = async () => {
    if (!newDocName.trim()) return alert("文档名称不能为空");
    if (!currentUser) return alert("未登录");

    setIsCreating(true);
    
    // 强制处理 null 为 0 (针对某些后端的兼容处理)
    const finalFolderId = createTarget.id; 

    try {
      const response = await fetch('http://localhost:8080/api/document/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'creator_id': currentUser.id.toString() },
        body: JSON.stringify({ name: newDocName, folderId: finalFolderId, content: "" })
      });
      const result = await response.json();
      if (result.code === 200) {
        setShowCreateDocModal(false);
        setNewDocName("");
        triggerRefresh(); 
      } else {
        alert(result.message || "创建失败");
      }
    } catch (err) { console.error(err); alert("网络错误"); } finally { setIsCreating(false); }
  };

  return (
    <div className="w-full h-full min-h-[300px]" onContextMenu={handleGlobalContextMenu}>
      {rootContent.folders.map(folder => (
        <FileTreeNode key={`folder-${folder.id}`} item={folder} type="folder" onSelectDoc={onSelectDoc} onNodeContextMenu={handleNodeContextMenu} refreshTrigger={refreshNodeId} />
      ))}
      {rootContent.documents.map(doc => (
        <FileTreeNode key={`doc-${doc.id}`} item={doc} type="document" onSelectDoc={onSelectDoc} onNodeContextMenu={handleNodeContextMenu} refreshTrigger={refreshNodeId} />
      ))}
      
      {rootContent.folders.length === 0 && rootContent.documents.length === 0 && (
         <div className="text-center text-xs text-gray-400 mt-10">暂无文件<br/>右键点击此处创建</div>
      )}

      {/* 右键菜单 */}
      {contextMenu.visible && (
        <div 
          className="fixed bg-white border border-gray-200 shadow-xl rounded-lg py-1 z-50 w-40 animate-in fade-in duration-100"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onClick={(e) => e.stopPropagation()} 
        >
          <div className="px-4 py-1 text-xs text-gray-400 border-b border-gray-100 mb-1 truncate">
             在: {contextMenu.targetName}
          </div>
          <button onClick={() => openModal('folder')} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2">
             <Folder size={14} className="text-yellow-500" /> 新建文件夹
          </button>
          <button onClick={() => openModal('document')} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2">
             <FileText size={14} className="text-blue-500" /> 新建文档
          </button>
        </div>
      )}

      {/* 弹窗 1: 创建文件夹 */}
      {showCreateFolderModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/20 backdrop-blur-sm">
           <div className="bg-white rounded-xl shadow-2xl w-80 p-4 animate-in fade-in zoom-in duration-200">
              <div className="flex justify-between items-center mb-3">
                 <h3 className="font-bold text-gray-800">新建文件夹 <span className="text-xs font-normal text-gray-500">({createTarget.name})</span></h3>
                 <button onClick={() => setShowCreateFolderModal(false)}><X size={18} className="text-gray-400" /></button>
              </div>
              <input autoFocus placeholder="文件夹名称" value={newFolderName} onChange={e => setNewFolderName(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleCreateFolder()} className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none mb-4" />
              <div className="flex justify-end gap-2">
                 <button onClick={() => setShowCreateFolderModal(false)} className="px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-100 rounded">取消</button>
                 <button onClick={handleCreateFolder} disabled={isCreating} className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-1">{isCreating && <Loader2 size={12} className="animate-spin" />} 创建</button>
              </div>
           </div>
        </div>
      )}

      {/* 弹窗 2: 创建文档 */}
      {showCreateDocModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/20 backdrop-blur-sm">
           <div className="bg-white rounded-xl shadow-2xl w-80 p-4 animate-in fade-in zoom-in duration-200">
              <div className="flex justify-between items-center mb-3">
                 <h3 className="font-bold text-gray-800">新建文档 <span className="text-xs font-normal text-gray-500">({createTarget.name})</span></h3>
                 <button onClick={() => setShowCreateDocModal(false)}><X size={18} className="text-gray-400" /></button>
              </div>
              <input autoFocus placeholder="文档标题 (例如: 需求文档)" value={newDocName} onChange={e => setNewDocName(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleCreateDocument()} className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none mb-4" />
              <div className="flex justify-end gap-2">
                 <button onClick={() => setShowCreateDocModal(false)} className="px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-100 rounded">取消</button>
                 <button onClick={handleCreateDocument} disabled={isCreating} className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-1">{isCreating && <Loader2 size={12} className="animate-spin" />} 创建</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
});

export default FileTree;