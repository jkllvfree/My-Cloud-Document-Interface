import React, { useState, useEffect } from 'react';
import { X, User, Settings, Lock, Mail, Phone, FileText, Save, Loader2, KeyRound } from 'lucide-react';

// initialTab: 'view' | 'edit'
export default function SettingsModal({ isOpen, onClose, currentUser, onUpdateUser, initialTab = 'view', onLogout }) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [isLoading, setIsLoading] = useState(false);

  // === 表单数据 (仅用于 Edit 模式) ===
  const [formData, setFormData] = useState({
    nickname: '',
    bio: '',
    phone: '',
    email: '',
    // 密码部分
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // 打开时初始化数据
  useEffect(() => {
    if (isOpen && currentUser) {
      setActiveTab(initialTab); 
      
      // ✅ 核心修复：优先读取 phoneNum
      const realPhone = currentUser.phoneNum || currentUser.phone || '';

      setFormData(prev => ({
        ...prev,
        nickname: currentUser.nickname || '',
        bio: currentUser.bio || '',
        phone: realPhone, // 赋值给表单
        email: currentUser.email || '', 
        oldPassword: '',
        newPassword: '',
        confirmPassword: ''
      }));
    }
  }, [isOpen, currentUser, initialTab]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // === 提交：修改基本信息 ===
  const handleUpdateInfo = async (e) => {
    e.preventDefault();
    if (!formData.nickname.trim()) {
        alert("昵称不能为空");
        return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:8080/api/user/update/info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          newNickname: formData.nickname,
          newBio: formData.bio,
          newPhoneNum: formData.phone, 
          newEmail: formData.email  
        })
      });
      const result = await response.json();

      if (result.code === 200) {
        // ✅ 核心修复：更新成功后，同步更新 phoneNum 字段
        onUpdateUser({ 
            ...currentUser, 
            nickname: formData.nickname,
            bio: formData.bio,
            phoneNum: formData.phone, // 确保这个字段被更新
            phone: formData.phone,    // 兼容性更新
            email: formData.email
        });
        alert('基本信息修改成功！');
        onClose();
      } else {
        alert(result.msg || '修改失败');
      }
    } catch (error) {
      console.error(error);
      alert('网络错误');
    } finally {
      setIsLoading(false);
    }
  };

  // === 提交：重置密码 ===
  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (formData.newPassword !== formData.confirmPassword) {
      alert("两次新密码输入不一致");
      return;
    }
    if (formData.newPassword.length < 6) {
       alert("新密码太短了");
       return;
    }
    
    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:8080/api/user/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          oldPassword: formData.oldPassword,
          newPassword: formData.newPassword
        })
      });
      const result = await response.json();
      if (result.code === 200) {
        alert('密码修改成功，为了安全，请重新登录');
        
        // ✨ 关键点：只有在这里，才调用退出登录
        if (onLogout) {
            onLogout(); 
        } else {
            // 如果没传 onLogout，才强制刷新作为兜底
            window.location.reload(); 
        }
      } else {
        alert(result.msg || '原密码错误');
      }
    } catch (error) {
       alert('网络错误');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const displayPhone = currentUser?.phoneNum || '未绑定';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* 顶部导航栏 */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100 bg-gray-50/50">
          <div className="flex gap-6">
            <button
              onClick={() => setActiveTab('view')}
              className={`text-sm font-bold transition-colors ${
                activeTab === 'view' ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              个人资料
            </button>
            <button
              onClick={() => setActiveTab('edit')}
              className={`text-sm font-bold transition-colors ${
                activeTab === 'edit' ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              账号信息修改
            </button>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded-full transition-colors text-gray-500">
            <X size={20} />
          </button>
        </div>

        {/* 内容区域 */}
        <div className="p-6 overflow-y-auto">
          
          {/* ==================== 1. 个人资料 (纯展示) ==================== */}
          {activeTab === 'view' && (
            <div className="space-y-6">
              <div className="flex flex-col items-center pb-6 border-b border-gray-100">
                
                {/* ✅ 头像渲染逻辑：优先 render 图片 */}
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

              <div className="space-y-4">
                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                   <Phone size={18} className="text-gray-400 mt-0.5" />
                   <div>
                      <p className="text-xs text-gray-400 font-medium">绑定手机</p>
                      {/* ✅ 这里使用的是 displayPhone 变量 */}
                      <p className="text-gray-700 font-medium">{displayPhone}</p>
                   </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                   <Mail size={18} className="text-gray-400 mt-0.5" />
                   <div>
                      <p className="text-xs text-gray-400 font-medium">绑定邮箱</p>
                      <p className="text-gray-700 font-medium">{currentUser?.email || '未绑定'}</p>
                   </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg min-h-[80px]">
                   <FileText size={18} className="text-gray-400 mt-0.5" />
                   <div>
                      <p className="text-xs text-gray-400 font-medium">个人简介</p>
                      <p className="text-gray-700 text-sm leading-relaxed mt-1">
                        {currentUser?.bio || '这个人很懒，什么都没写...'}
                      </p>
                   </div>
                </div>
              </div>
            </div>
          )}

          {/* ==================== 2. 账号信息修改 (表单) ==================== */}
          {activeTab === 'edit' && (
            <div className="space-y-8">
              
              <form onSubmit={handleUpdateInfo} className="space-y-4">
                <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                  <User size={16} /> 基本资料
                </h3>

                <div>
                    <label className="block text-xs text-gray-500 mb-1">修改昵称</label>
                    <input 
                      type="text" name="nickname" 
                      value={formData.nickname} onChange={handleChange}
                      placeholder="请输入新的昵称"
                      className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">修改手机号</label>
                    <input 
                      type="tel" name="phone" 
                      value={formData.phone} onChange={handleChange}
                      className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">修改邮箱</label>
                    <input 
                      type="email" name="email" 
                      value={formData.email} onChange={handleChange}
                      className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                </div>

                <div>
                   <label className="block text-xs text-gray-500 mb-1">修改简介</label>
                   <textarea 
                      name="bio" rows="3" maxLength={255}
                      value={formData.bio} onChange={handleChange}
                      className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none"
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
              
              <div className="h-px bg-gray-100"></div>

              <form onSubmit={handleUpdatePassword} className="space-y-4">
                <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2 text-red-600">
                  <KeyRound size={16} /> 密码重置
                </h3>
                
                <div className="space-y-3 bg-red-50 p-4 rounded-lg border border-red-100">
                   <div>
                     <input 
                       type="password" name="oldPassword" placeholder="当前旧密码"
                       value={formData.oldPassword} onChange={handleChange}
                       className="w-full px-3 py-2 border border-red-200 rounded text-sm focus:ring-2 focus:ring-red-500 outline-none"
                     />
                   </div>
                   <div className="flex gap-3">
                     <input 
                       type="password" name="newPassword" placeholder="新密码"
                       value={formData.newPassword} onChange={handleChange}
                       className="w-full px-3 py-2 border border-red-200 rounded text-sm focus:ring-2 focus:ring-red-500 outline-none"
                     />
                     <input 
                       type="password" name="confirmPassword" placeholder="确认新密码"
                       value={formData.confirmPassword} onChange={handleChange}
                       className="w-full px-3 py-2 border border-red-200 rounded text-sm focus:ring-2 focus:ring-red-500 outline-none"
                     />
                   </div>
                   
                   <div className="flex justify-end pt-2">
                     <button 
                       type="submit" disabled={isLoading}
                       className="bg-red-600 text-white px-4 py-1.5 rounded text-sm hover:bg-red-700 disabled:opacity-50"
                     >
                       重置密码
                     </button>
                   </div>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}