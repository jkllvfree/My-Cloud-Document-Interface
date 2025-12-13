import React, { useState, useRef, useEffect, useCallback } from 'react';
import Sidebar from '../features/home/Sidebar';
import Header from '../features/home/Header';
import EditorArea from '../features/home/EditorArea';
import SettingsModal from '../components/SettingsModal';

import { documentService } from '@/api/document';
import { userService } from '@/api/user';
import { fileService } from '@/api/file';
import { folderService } from '@/api/folder';

export default function HomePage({ currentUser, onLogout, onUpdateUser }) {
  // === 状态定义 ===
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [docContent, setDocContent] = useState('');
  const [docLoading, setDocLoading] = useState(false);
  const [avatarDisplay, setAvatarDisplay] = useState(currentUser?.avatarUrl);
  
  // 设置弹窗状态
  const [showSettings, setShowSettings] = useState(false);
  const [settingsTab, setSettingsTab] = useState('view');

  const [personalFiles, setPersonalFiles] = useState({ folders: [], documents: [] });
  const [sharedFiles, setSharedFiles] = useState({ folders: [], documents: [] });

  // 文件树引用 (用于刷新列表)
  const fileTreeRef = useRef(null);

  // 监听用户头像变化
  useEffect(() => {
    setAvatarDisplay(currentUser?.avatarUrl);
  }, [currentUser]);

  // === 业务逻辑 ===
  // 加载文档详情
    const fetchAllFiles = useCallback(async () => {
    try {
      // 并行请求两个接口
      const [personalRes, sharedRes] = await Promise.all([
        folderService.getContent(),       // 我的文件
        folderService.getSharedContent()  // 共享文件
      ]);

      if (personalRes.code === 200) {
        setPersonalFiles(personalRes.data || { folders: [], documents: [] });
      }
      if (sharedRes && sharedRes.code === 200) {
        setSharedFiles(sharedRes.data || { folders: [], documents: [] });
      }
    } catch (error) {
      console.error("加载文件列表失败:", error);
    }
  }, []);

  // 初始化加载
  useEffect(() => {
    if (currentUser) {
        fetchAllFiles();
    }
  }, [currentUser, fetchAllFiles]);

  useEffect(() => {
    // 1. 如果没有选中，或者是文件夹，就不请求
    if (!selectedDoc || selectedDoc.type === 'folder') return;

    const fetchDocDetail = async () => {
      setDocLoading(true); // 开启加载状态
      try {
        const res = await documentService.getDetail(selectedDoc.id);
        
        if (res.code === 200) {
          // ✅ 核心修复：拿到后端返回的 content，存入 state
          setDocContent(res.data.content || ''); 
        } else {
          console.error("加载文档详情失败:", res.msg);
          setDocContent(''); // 失败兜底
        }
      } catch (err) {
        console.error("获取文档详情网络错误:", err);
      } finally {
        setDocLoading(false); // 关闭加载状态
      }
    };

    fetchDocDetail();
  }, [selectedDoc?.id]); // 👈 只要 ID 变了，就重新请求

  // 2. 保存文档内容
  const handleSaveDoc = async (newContent) => {
    if (!selectedDoc) return;
    try {
      const result = await documentService.updateInfo({
        id: selectedDoc.id,
        content: newContent
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
        name: newName
      });
      
      if (result.code === 200) {
        fetchAllFiles();
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
      const uploadRes = await fileService.uploadImage(file);
      if (uploadRes.code === 200) {
        const newUrl = uploadRes.data;
        setAvatarDisplay(newUrl);

        const updateRes = await userService.updateAvatar( newUrl );
        if (updateRes.code === 200) {
             onUpdateUser && onUpdateUser({ ...currentUser, avatarUrl: newUrl });
             alert("头像更新成功");
        } else {

             alert("图片上传成功但保存资料失败: " + updateRes.msg);
        }
      }
    } catch (err) {
      console.error("捕获到异常:", err);
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
        // ✅ 传递数据和刷新方法
        personalData={personalFiles}
        sharedData={sharedFiles}
        onRefresh={fetchAllFiles}
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