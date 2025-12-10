import React, { useState, useRef, useEffect } from 'react';
import Sidebar from '../features/home/Sidebar';
import Header from '../features/home/Header';
import EditorArea from '../features/home/EditorArea';
import SettingsModal from '../components/SettingsModal';

import { documentService } from '../api/document';
import { userService } from '../api/user';

export default function HomePage({ currentUser, onLogout, onUpdateUser }) {
  // === 状态定义 ===
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [docContent, setDocContent] = useState('');
  const [docLoading, setDocLoading] = useState(false);
  const [avatarDisplay, setAvatarDisplay] = useState(currentUser?.avatarUrl);
  
  // 设置弹窗状态
  const [showSettings, setShowSettings] = useState(false);
  const [settingsTab, setSettingsTab] = useState('view');

  // 文件树引用 (用于刷新列表)
  const fileTreeRef = useRef(null);

  // 监听用户头像变化
  useEffect(() => {
    setAvatarDisplay(currentUser?.avatarUrl);
  }, [currentUser]);

  // === 业务逻辑 ===

  // 1. 加载文档详情
  useEffect(() => {
    if (!selectedDoc) return;
    
    const fetchDetail = async () => {
      setDocLoading(true);
      try {
        const result = await documentService.getDetail(selectedDoc.id);
        if (result.code === 200) {
          setDocContent(result.data.content);
        }
      } catch (err) {
        console.error("加载文档失败", err);
      } finally {
        setDocLoading(false);
      }
    };
    fetchDetail();
  }, [selectedDoc?.id]); // 只有 id 变了才重载，避免改名时重载

  // 2. 保存文档内容
  const handleSaveDoc = async (newContent) => {
    if (!selectedDoc) return;
    try {
      const result = await documentService.updateInfo({
        id: selectedDoc.id,
        newContent: newContent
      });
      if (result.code === 200) {
        console.log("保存成功");
      } else {
        alert("保存失败: " + result.msg);
      }
    } catch (err) {
      alert("保存时网络错误");
    }
  };

  // 3. 重命名文档
  const handleRenameDoc = async (newName) => {
    if (!selectedDoc || !newName.trim() || newName === selectedDoc.originalName) return;

    const oldName = selectedDoc.name;
    // 此时 selectedDoc.name 已经被 onChange 改成新的了，这里主要负责提交后端
    
    try {
      const result = await documentService.updateInfo({
        id: selectedDoc.id,
        newName: newName
      });
      
      if (result.code === 200) {
        // 刷新左侧文件树
        fileTreeRef.current?.refresh(selectedDoc.folderId);
        // 更新本地记录的"原始名称"，防止下次误触发
        setSelectedDoc(prev => ({ ...prev, originalName: newName }));
      } else {
        // 失败回滚
        setSelectedDoc(prev => ({ ...prev, name: prev.originalName || oldName }));
        alert("重命名失败: " + result.msg);
      }
    } catch (err) {
      setSelectedDoc(prev => ({ ...prev, name: prev.originalName || oldName }));
    }
  };

  // 4. 上传头像
  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      // 第一步：上传文件
      const uploadRes = await userService.uploadAvatarFile(file);
      if (uploadRes.code === 200) {
        const newUrl = uploadRes.data;
        setAvatarDisplay(newUrl);
        
        // 第二步：更新用户资料
        await userService.updateUserAvatar(currentUser.id, newUrl);
        
        // 第三步：通知 App 更新全局状态
        onUpdateUser && onUpdateUser({ ...currentUser, avatarUrl: newUrl });
      }
    } catch (err) {
      alert("头像上传失败");
    }
  };

  // === 页面渲染 ===
  return (
    <div className="flex h-screen bg-white overflow-hidden">
      {/* 左侧边栏 */}
      <Sidebar 
        fileTreeRef={fileTreeRef}
        onSelectDoc={(doc) => setSelectedDoc({ ...doc, originalName: doc.name })}
        currentUser={currentUser}
      />

      {/* 右侧主体 */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header 
          currentUser={currentUser}
          avatarDisplay={avatarDisplay}
          selectedDoc={selectedDoc}
          onTitleChange={(val) => setSelectedDoc(prev => ({ ...prev, name: val }))}
          onRenameDoc={handleRenameDoc}
          onAvatarUpload={handleAvatarUpload}
          onOpenSettings={(tab) => { setSettingsTab(tab); setShowSettings(true); }}
          onLogout={onLogout}
        />

        <EditorArea 
          selectedDoc={selectedDoc}
          docContent={docContent}
          docLoading={docLoading}
          onSaveDoc={handleSaveDoc}
        />
      </div>

      {/* 弹窗 */}
      <SettingsModal 
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        currentUser={currentUser}
        onUpdateUser={(info) => { onUpdateUser(info); setShowSettings(false); }}
        initialTab={settingsTab}
        onLogout={onLogout}
      />
    </div>
  );
}