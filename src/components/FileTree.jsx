import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import FileTreeNode from '@/features/file-tree/FileTreeNode';
import ContextMenu from '@/features/file-tree/ContextMenu';
import CreateFolderModal from '@/features/file-tree/CreateFolderModal';
import CreateDocModal from '@/features/file-tree/CreateDocModal';
import ShareModal from '@/features/file-tree/ShareModal'; 
import { folderService } from '@/api/folder';

const FileTree = forwardRef(({ onSelectDoc, currentUser, treeData, allowCreate = true, onRefresh }, ref) => {
  // === 状态管理 ===
  // const [rootContent, setRootContent] = useState({ folders: [], documents: [] });
  const { folders = [], documents = [] } = treeData || {};
  const [refreshNodeId, setRefreshNodeId] = useState(null); // 控制特定节点刷新

  // 右键菜单状态
  const [contextMenu, setContextMenu] = useState({
    visible: false,
    x: 0,
    y: 0,
    targetId: null,
    targetName: "根目录",
    type: "root",
  });

  // 弹窗状态
  const [createTarget, setCreateTarget] = useState({
    id: null,
    name: "根目录",
  }); // 记录当前要对哪个文件夹进行操作
  const [modalType, setModalType] = useState(null); // 'folder' | 'document' | null
  //分享弹窗状态
  const [shareTarget, setShareTarget] = useState({ id: null, name: "" });
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  useEffect(() => {
    const handleClickOutside = () => {
      // 只要点击了左键，就关闭菜单
      setContextMenu((prev) => ({ ...prev, visible: false }));
    };

    // 添加监听器
    document.addEventListener("click", handleClickOutside);
    // 同时也监听右键点击（防止点了别的地方右键，旧菜单还在）
    // document.addEventListener('contextmenu', handleClickOutside);

    return () => {
      document.removeEventListener("click", handleClickOutside);
      // document.removeEventListener('contextmenu', handleClickOutside);
    };
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
      setCreateTarget({ id: null, name: "根目录" });
      setModalType(type);
    },
  }));

  // 处理右键菜单的“分享”点击
  const openShareModal = () => {
    // 设置当前要分享的文档信息
    console.log("正在打开分享弹窗，文档ID:", contextMenu.targetId); // 建议加上这行调试
    setShareTarget({ id: contextMenu.targetId, name: contextMenu.targetName });
    // 关闭右键菜单
    setContextMenu((prev) => ({ ...prev, visible: false }));
    // 打开弹窗
    setIsShareModalOpen(true);
  };

  // 3. 处理右键事件
  const handleContextMenu = (e, item = null, type = 'root') => {
    e.preventDefault();
    e.stopPropagation(); // 🔥 阻止冒泡：防止点子元素触发父元素的右键

    // ✅ 如果不允许创建（比如在共享栏），且点击的是空白处，则不显示菜单
    if (!allowCreate && !item) return;

    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      targetId: item ? item.id : null,
      targetName: item ? item.name : "根目录",
      type: type
    });
  };

  // 4. 打开创建弹窗 (从右键菜单触发)
  const openCreateModal = (type) => {
    setCreateTarget({ id: contextMenu.targetId, name: contextMenu.targetName });
    setContextMenu((prev) => ({ ...prev, visible: false }));
    setModalType(type);
  };

  const handleCreateSuccess = () => {
  // 情况 1: 在根目录创建 (createTarget.id 为 null)
  // 这时候必须调用父组件的 onRefresh，因为根目录列表是父组件传进来的
  if (!createTarget.id) {
    if (onRefresh) onRefresh();
  } 
  
  // 情况 2: 在子文件夹里创建 (createTarget.id 有值)
  // 💡 关键修改：不要调用 onRefresh()！而是触发内部局部刷新
  else {
    // 1. 先置空，保证状态确实发生了变化
    setRefreshNodeId(null);
    
    // 2. 稍微延迟一下，再设置成当前文件夹 ID
    // 这样对应的 FileTreeNode 就会监听到变化，自己去 fetchChildren()
    setTimeout(() => {
      setRefreshNodeId(createTarget.id);
    }, 50);
  }
  
  // 关闭弹窗
  setModalType(null);
};


  return (
    <div
      className="w-full h-full min-h-[50px]"
      // ✅ 1. 根目录背景右键：传入 'root'
      onContextMenu={(e) => handleContextMenu(e, null, "root")}
    >
      {/* 渲染文件夹 */}
      {folders.map((folder) => (
        <FileTreeNode
          key={`folder-${folder.id}`}
          item={folder}
          type="folder"
          onSelectDoc={onSelectDoc}

          onNodeContextMenu={(e, nodeItem, type) =>
            handleContextMenu(e, nodeItem, type)
          }
          refreshTrigger={refreshNodeId}
        />
      ))}
      {/* 渲染文档 */}
      {documents.map((doc) => (
        <FileTreeNode
          key={`doc-${doc.id}`}
          item={doc}
          type="document"
          onSelectDoc={onSelectDoc}
          // ✅ 3. 文档右键：显式传入 'document'
          onNodeContextMenu={(e, nodeItem) =>
            handleContextMenu(e, nodeItem, "document")
          }
          refreshTrigger={refreshNodeId}
        />
      ))}

      {/* 空状态提示 */}
      {folders.length === 0 && documents.length === 0 && (
        <div className="text-center text-xs text-gray-400 mt-4 italic">
          {allowCreate ? "暂无文件，右键创建" : "暂无共享文档"}
        </div>
      )}

      {/* 右键菜单 - 传入 allowCreate 控制显示 */}
      <ContextMenu
        {...contextMenu}
        allowCreate={allowCreate} // ✅ 需修改 ContextMenu 组件支持此属性，或者在这里做条件渲染
        onCreateFolder={() => openCreateModal("folder")}
        onCreateDoc={() => openCreateModal("document")}
        onShare={openShareModal}
      />

      {/* ✅ 渲染分享弹窗 */}
      {allowCreate && (
        <ShareModal
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          docId={shareTarget.id}
          docName={shareTarget.name}
          currentUser={currentUser}
        />
      )}

      {/* 只有允许创建时，才渲染弹窗 */}
      {allowCreate && (
        <>
          <CreateFolderModal
            isOpen={modalType === "folder"}
            onClose={() => setModalType(null)}
            parentId={createTarget.id}
            parentName={createTarget.name}
            currentUser={currentUser}
            onSuccess={handleCreateSuccess}
          />

          <CreateDocModal
            isOpen={modalType === "document"}
            onClose={() => setModalType(null)}
            parentId={createTarget.id}
            parentName={createTarget.name}
            currentUser={currentUser}
            onSuccess={handleCreateSuccess}
          />
        </>
      )}
    </div>
  );
});

export default FileTree;