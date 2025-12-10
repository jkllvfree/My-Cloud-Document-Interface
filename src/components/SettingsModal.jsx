import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import ProfileView from '@/features/settings/ProfileView';
import ProfileEditForm from '@/features/settings/ProfileEditForm';
import PasswordForm from '@/features/settings/PasswordForm';

export default function SettingsModal({ isOpen, onClose, currentUser, onUpdateUser, initialTab = 'view', onLogout }) {
  const [activeTab, setActiveTab] = useState(initialTab);

  // 每次打开时重置 Tab
  useEffect(() => {
    if (isOpen) setActiveTab(initialTab);
  }, [isOpen, initialTab]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100 bg-gray-50/50">
          <div className="flex gap-6">
            <TabButton active={activeTab === 'view'} onClick={() => setActiveTab('view')}>个人资料</TabButton>
            <TabButton active={activeTab === 'edit'} onClick={() => setActiveTab('edit')}>账号设置</TabButton>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded-full transition-colors text-gray-500">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto">
          {activeTab === 'view' ? (
            <ProfileView currentUser={currentUser} />
          ) : (
            <div className="space-y-8">
              <ProfileEditForm currentUser={currentUser} onUpdateUser={onUpdateUser} />
              <div className="h-px bg-gray-100" />
              <PasswordForm currentUser={currentUser} onLogout={onLogout} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// 小组件：Tab 按钮
const TabButton = ({ active, onClick, children }) => (
  <button
    onClick={onClick}
    className={`text-sm font-bold transition-colors ${
      active ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'
    }`}
  >
    {children}
  </button>
);