import React, { useState } from 'react';
import { KeyRound, Loader2 } from 'lucide-react';
import { userService } from '@/api/user';

export default function PasswordForm({ currentUser, onLogout }) {
  const [passwords, setPasswords] = useState({ old: '', new: '', confirm: '' });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (passwords.new !== passwords.confirm) return alert("两次密码不一致");
    if (passwords.new.length < 6) return alert("密码太短");

    setIsLoading(true);
    try {
      const result = await userService.changePassword({ oldPassword: passwords.old, newPassword: passwords.new });
      if (result.code === 200) {
        alert('密码修改成功，请重新登录');
        onLogout ? onLogout() : window.location.reload();
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
      <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2 text-red-600">
        <KeyRound size={16} /> 密码重置
      </h3>
      
      <div className="space-y-3 bg-red-50 p-4 rounded-lg border border-red-100">
         <input 
           type="password" placeholder="当前旧密码"
           className="w-full px-3 py-2 border border-red-200 rounded text-sm focus:ring-2 focus:ring-red-500 outline-none"
           value={passwords.old}
           onChange={e => setPasswords({...passwords, old: e.target.value})}
         />
         <div className="flex gap-3">
           <input 
             type="password" placeholder="新密码"
             className="w-full px-3 py-2 border border-red-200 rounded text-sm focus:ring-2 focus:ring-red-500 outline-none"
             value={passwords.new}
             onChange={e => setPasswords({...passwords, new: e.target.value})}
           />
           <input 
             type="password" placeholder="确认新密码"
             className="w-full px-3 py-2 border border-red-200 rounded text-sm focus:ring-2 focus:ring-red-500 outline-none"
             value={passwords.confirm}
             onChange={e => setPasswords({...passwords, confirm: e.target.value})}
           />
         </div>
         <div className="flex justify-end pt-2">
           <button 
             type="submit" disabled={isLoading}
             className="bg-red-600 text-white px-4 py-1.5 rounded text-sm hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
           >
             {isLoading && <Loader2 size={12} className="animate-spin" />} 重置密码
           </button>
         </div>
      </div>
    </form>
  );
}