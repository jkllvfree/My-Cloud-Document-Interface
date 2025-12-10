import React from 'react';
import { Mail, Phone, FileText } from 'lucide-react';

export default function ProfileView({ currentUser }) {
  const displayPhone = currentUser?.phoneNum || currentUser?.phone || '未绑定';

  return (
    <div className="space-y-6">
      {/* 头像与昵称 */}
      <div className="flex flex-col items-center pb-6 border-b border-gray-100">
        {currentUser?.avatarUrl ? (
          <img 
            src={currentUser.avatarUrl} 
            alt="avatar" 
            className="w-20 h-20 rounded-full object-cover mb-3 shadow-md border-2 border-white"
          />
        ) : (
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-3xl font-bold mb-3 shadow-inner">
            {currentUser?.nickname?.charAt(0).toUpperCase() || 'U'}
          </div>
        )}
        <h3 className="text-xl font-bold text-gray-800">{currentUser?.nickname}</h3>
        <span className="text-sm text-gray-400">ID: {currentUser?.id}</span>
      </div>

      {/* 详细信息列表 */}
      <div className="space-y-4">
        <InfoItem icon={Phone} label="绑定手机" value={displayPhone} />
        <InfoItem icon={Mail} label="绑定邮箱" value={currentUser?.email || '未绑定'} />
        <InfoItem 
          icon={FileText} 
          label="个人简介" 
          value={currentUser?.bio || '这个人很懒，什么都没写...'} 
          isLongText 
        />
      </div>
    </div>
  );
}

// 小组件：复用列表项
function InfoItem({ icon: Icon, label, value, isLongText }) {
  return (
    <div className={`flex items-start gap-3 p-3 bg-gray-50 rounded-lg ${isLongText ? 'min-h-[80px]' : ''}`}>
      <Icon size={18} className="text-gray-400 mt-0.5" />
      <div>
        <p className="text-xs text-gray-400 font-medium">{label}</p>
        <p className={`text-gray-700 ${isLongText ? 'text-sm leading-relaxed mt-1' : 'font-medium'}`}>
          {value}
        </p>
      </div>
    </div>
  );
}