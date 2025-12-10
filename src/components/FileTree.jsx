import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import FileTreeNode from '@/features/file-tree/FileTreeNode';
import ContextMenu from '@/features/file-tree/ContextMenu';
import CreateFolderModal from '@/features/file-tree/CreateFolderModal';
import CreateDocModal from '@/features/file-tree/CreateDocModal';
import { folderService } from '@/api/folder';

const FileTree = forwardRef(({ onSelectDoc, currentUser }, ref) => {
  // === 状态管理 ===
  const [rootContent, setRootContent] = useState({ folders: [], documents: [] });
  const [refreshNodeId, setRefreshNodeId] = useState(null); // 控制特定节点刷新

  // 右键菜单状态
  const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, targetId: null, targetName: '根目录' });
  
  // 弹窗状态
  const [createTarget, setCreateTarget] = useState({ id: null, name: '根目录' }); // 记录当前要对哪个文件夹进行操作
  const [modalType, setModalType] = useState(null); // 'folder' | 'document' | null

  // === 核心逻辑 ===

  // 1. 获取根目录
  const fetchRoot = async () => {
    try {
      const result = await folderService.getContent(null);
      if (result.code === 200) setRootContent(result.data);
    } catch(e) { console.error(e); }
  };

  useEffect(() => {
    fetchRoot();
    const closeMenu = () => setContextMenu(prev => ({ ...prev, visible: false }));
    document.addEventListener('click', closeMenu);
    return () => document.removeEventListener('click', closeMenu);
  }, []);

  // 2. 暴露给父组件的方法
  useImperativeHandle(ref, () => ({
    refresh: (parentId = null) => {
      if (!parentId || parentId === 0) fetchRoot();
      else {
        setRefreshNodeId(null);
        setTimeout(() => setRefreshNodeId(parentId), 50);
      }
    },
    triggerRootCreate: (type) => {
      setCreateTarget({ id: null, name: '根目录' });
      setModalType(type);
    }
  }));

  // 3. 处理右键事件
  const handleContextMenu = (e, item = null) => {
    e.preventDefault();
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      targetId: item ? item.id : null,
      targetName: item ? item.name : '根目录'
    });
  };

  // 4. 打开创建弹窗 (从右键菜单触发)
  const openCreateModal = (type) => {
    setCreateTarget({ id: contextMenu.targetId, name: contextMenu.targetName });
    setContextMenu(prev => ({ ...prev, visible: false }));
    setModalType(type);
  };

  // 5. 创建成功后的回调
  const handleCreateSuccess = () => {
    // 如果是在根目录创建，刷新根目录；否则触发对应节点的刷新
    if (createTarget.id === null) fetchRoot();
    else {
      setRefreshNodeId(null);
      setTimeout(() => setRefreshNodeId(createTarget.id), 50);
    }
  };

  return (
    <div className="w-full h-full min-h-[300px]" onContextMenu={(e) => handleContextMenu(e, null)}>
      {/* 根目录渲染 */}
      {rootContent.folders.map(folder => (
        <FileTreeNode
          key={`folder-${folder.id}`}
          item={folder}
          type="folder"
          onSelectDoc={onSelectDoc}
          onNodeContextMenu={handleContextMenu}
          refreshTrigger={refreshNodeId}
        />
      ))}
      {rootContent.documents.map(doc => (
        <FileTreeNode
          key={`doc-${doc.id}`}
          item={doc}
          type="document"
          onSelectDoc={onSelectDoc}
          onNodeContextMenu={handleContextMenu}
          refreshTrigger={refreshNodeId}
        />
      ))}

      {/* 空状态 */}
      {rootContent.folders.length === 0 && rootContent.documents.length === 0 && (
        <div className="text-center text-xs text-gray-400 mt-10">暂无文件<br />右键点击此处创建</div>
      )}

      {/* 独立组件：右键菜单 */}
      <ContextMenu 
        {...contextMenu}
        onCreateFolder={() => openCreateModal('folder')}
        onCreateDoc={() => openCreateModal('document')}
      />

      {/* 独立组件：弹窗 */}
      <CreateFolderModal
        isOpen={modalType === 'folder'}
        onClose={() => setModalType(null)}
        parentId={createTarget.id}
        parentName={createTarget.name}
        currentUser={currentUser}
        onSuccess={handleCreateSuccess}
      />

      <CreateDocModal
        isOpen={modalType === 'document'}
        onClose={() => setModalType(null)}
        parentId={createTarget.id}
        parentName={createTarget.name}
        currentUser={currentUser}
        onSuccess={handleCreateSuccess}
      />
    </div>
  );
});

export default FileTree;