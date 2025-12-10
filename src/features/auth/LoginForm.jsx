import React, { useState } from 'react';
import { Mail, Lock, User, ArrowRight } from 'lucide-react';
import { authService } from '@/api/auth'; // 引入 API

export default function LoginForm({ onLoginSuccess }) {
  // === 状态管理 (和你原来的一样) ===
  const [mode, setMode] = useState('login'); 
  const [formData, setFormData] = useState({ account: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // === 逻辑处理 ===
  const toggleMode = (newMode) => {
    setMode(newMode);
    setError('');
    setFormData({ account: '', password: '' });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // 1. 校验逻辑 (保留)
    if (!formData.account.trim()) return setError('请输入账号');
    if (!formData.password) return setError('请输入密码');

    setLoading(true);
    setError('');

    try {
      let result;
      // 2. 调用 API (逻辑逻辑保留，只是 fetch 换成了 authService)
      if (mode === 'login') {
        result = await authService.login(formData.account, formData.password);
      } else {
        // 注册逻辑：保留你原本对 手机/邮箱 的判断逻辑
        const isEmail = formData.account.includes('@');
        const payload = {
          phoneNum: isEmail ? null : formData.account,
          email: isEmail ? formData.account : null,
          password: formData.password
        };
        result = await authService.register(payload);
      }

      // 3. 处理结果
      if (result.code === 200) {
        onLoginSuccess && onLoginSuccess(result.data);
      } else {
        setError(result.msg || '操作失败');
      }
    } catch (err) {
      console.error(err);
      setError('无法连接到服务器，请检查后端是否启动');
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="bg-white w-full max-w-md rounded-xl shadow-lg overflow-hidden border border-gray-100">
      
      {/* --- 顶部切换栏 --- */}
      <div className="flex border-b border-gray-100">
        <button
          onClick={() => toggleMode('login')}
          className={`flex-1 py-4 text-sm font-medium transition-colors ${
            mode === 'login' 
              ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/30' 
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          登录
        </button>
        <button
          onClick={() => toggleMode('register')}
          className={`flex-1 py-4 text-sm font-medium transition-colors ${
            mode === 'register' 
              ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/30' 
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          注册账号
        </button>
      </div>

      {/* --- 表单内容区域 --- */}
      <div className="p-8">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-800">
            {mode === 'login' ? '欢迎回来' : '创建新账户'}
          </h2>
          <p className="text-sm text-gray-500 mt-2">
            {mode === 'login' ? '继续编辑您的文档' : '开启多人协作之旅'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          
          {/* 账号输入框 (保留了原本的图标定位逻辑) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {mode === 'login' ? '账号' : '手机号 或 邮箱'}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                <User size={18} />
              </div>
              <input
                type="text"
                name="account"
                value={formData.account}
                onChange={handleChange}
                placeholder={mode === 'login' ? "手机号 / 邮箱 / 昵称" : "例如：example@mail.com"}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              />
            </div>
          </div>

          {/* 密码输入框 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">密码</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                <Lock size={18} />
              </div>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="请输入密码"
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              />
            </div>
          </div>

          {/* 错误提示 */}
          {error && (
            <div className="text-red-500 text-sm bg-red-50 p-2 rounded border border-red-100">
              {error}
            </div>
          )}

          {/* 提交按钮 */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full flex items-center justify-center py-2.5 px-4 rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors ${
              loading ? 'opacity-70 cursor-not-allowed' : ''
            }`}
          >
            {loading ? '处理中...' : (
              <>
                {mode === 'login' ? '立即登录' : '注册账号'}
                <ArrowRight size={16} className="ml-2" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}