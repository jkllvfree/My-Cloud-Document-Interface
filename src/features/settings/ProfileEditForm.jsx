import React, { useState, useEffect } from 'react';
import { User, Loader2 } from 'lucide-react';
import { userService } from '@/api/user';

export default function ProfileEditForm({ currentUser, onUpdateUser }) {
  const [formData, setFormData] = useState({
    nickname: '',
    bio: '',
    phone: '',
    email: '',
  });
  const [isLoading, setIsLoading] = useState(false);

  // 初始化表单
  useEffect(() => {
    if (currentUser) {
      setFormData({
        nickname: currentUser.nickname || '',
        bio: currentUser.bio || '',
        phone: currentUser.phoneNum || currentUser.phone || '',
        email: currentUser.email || '',
      });
    }
  }, [currentUser]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.nickname.trim()) return alert("昵称不能为空");

    setIsLoading(true);
    try {
      const result = await userService.updateInfo(formData);
      if (result.code === 200) {
        onUpdateUser({
          ...currentUser,
          nickname: formData.nickname,
          bio: formData.bio,
          phoneNum: formData.phone,
          email: formData.email
        });
        alert('修改成功！');
      } else {
        alert(result.msg || '修改失败');
      }
    } catch (err) {
      alert('网络错误');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
        <User size={16} /> 基本资料
      </h3>

      <div>
        <label className="block text-xs text-gray-500 mb-1">修改昵称</label>
        <input 
          className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          value={formData.nickname}
          onChange={e => setFormData({...formData, nickname: e.target.value})}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-gray-500 mb-1">修改手机号</label>
          <input 
            className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            value={formData.phone}
            onChange={e => setFormData({...formData, phone: e.target.value})}
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">修改邮箱</label>
          <input 
            className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            value={formData.email}
            onChange={e => setFormData({...formData, email: e.target.value})}
          />
        </div>
      </div>

      <div>
        <label className="block text-xs text-gray-500 mb-1">个人简介</label>
        <textarea 
          rows="3" maxLength={255}
          className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none"
          value={formData.bio}
          onChange={e => setFormData({...formData, bio: e.target.value})}
        />
      </div>

      <div className="flex justify-end">
        <button 
          type="submit" disabled={isLoading}
          className="bg-blue-600 text-white px-4 py-1.5 rounded text-sm hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
        >
          {isLoading ? <Loader2 size={14} className="animate-spin" /> : '保存资料'}
        </button>
      </div>
    </form>
  );
}