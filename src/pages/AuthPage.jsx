import React, { useState } from 'react';
// 引入图标库，让界面更好看。Mail=邮件图标, Lock=锁图标, User=人像图标, ArrowRight=箭头
import { Mail, Lock, User, ArrowRight } from 'lucide-react';

export default function AuthPage({onLoginSuccess}) {
  // ==================== 1. 状态管理区域 ====================
  
  // mode: 用于判断当前是"登录"还是"注册"状态
  // useState 是 React 的核心功能，用来保存页面上的变量
  const [mode, setMode] = useState('login'); 

  // formData: 保存用户在输入框里填的内容
  // 注册时只需要 account(账号) 和 password(密码)
  // 登录时只需要 account(账号) 和 password(密码)
  const [formData, setFormData] = useState({
    account: '', // 对应后端的 account 或 identifier
    password: ''
  });

  // error: 用来显示红色的错误提示文字
  const [error, setError] = useState('');
  
  // loading: 当点击按钮后，变成 true，显示"处理中..."防止用户重复点击
  const [loading, setLoading] = useState(false);

  // ==================== 2. 逻辑处理区域 ====================

  // 切换 登录/注册 模式的函数
  const toggleMode = (newMode) => {
    setMode(newMode);
    setError(''); // 切换时清空错误提示
    setFormData({ identifier: '', password: '' }); // 切换时清空输入框
  };

  // 当输入框内容变化时触发
  // e.target.name 是输入框的 name 属性 (比如 'password')
  // e.target.value 是用户输入的值
  const handleChange = (e) => {
    const { name, value } = e.target;
    // ...prev 表示保留之前的其他属性，只修改当前变化的这个属性
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // 点击"登录/注册"按钮时触发的主逻辑
  const handleSubmit = async (e) => {
    e.preventDefault(); // 阻止表单默认的刷新页面行为
    
    // 1. 简单的非空校验
    if (!formData.account.trim()) {
      setError('请输入账号');
      return;
    }
    if (!formData.password) {
      setError('请输入密码');
      return;
    }

    setLoading(true); // 开始转圈圈
    setError('');     // 清空旧报错

    // 2. 准备发送给后端的数据
    let url = '';
    let payload = {};

    if (mode === 'login') {
      url = 'http://localhost:8080/api/user/login'; // 假设你的后端端口是 8080
      // 对应后端的 LoginRequest 类
      payload = {
        account: formData.account, // 或者是 account，看你 Java 怎么写的
        password: formData.password
      };
    } else {
      url = 'http://localhost:8080/api/user/register';
      const isEmail = formData.account.includes('@');
      // 对应后端的 RegisterRequest 类
       payload = {
        phoneNum: isEmail ? null : formData.account,  // 如果不是，填这里
        email: isEmail ? formData.account : null,    // 如果是邮箱，填这里
        password: formData.password
      };
    }

    try {
      // 3. 发送网络请求 (fetch 是浏览器自带的功能)
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json', // 告诉后端我发的是 JSON
        },
        body: JSON.stringify(payload) // 把对象转成字符串发送
      });

      // 4. 解析后端返回的结果 (JsonResult)
      const result = await response.json(); 

      // 假设你的 JsonResult 里有个 code 字段，200 表示成功
      if (result.code === 200) {
        if (onLoginSuccess) {
            onLoginSuccess(result.data);
        }
  }
      else {
        // 后端返回了错误（比如"账号已存在"或"密码错误"）
        setError(result.msg || '操作失败');
      }

    } catch (err) {
      // 网络断了，或者后端没启动
      console.error(err);
      setError('无法连接到服务器，请检查后端是否启动');
    } finally {
      setLoading(false); // 无论成功失败，都停止转圈圈
    }
  };

  // ==================== 3. 页面渲染区域 (HTML) ====================
  return (
    // 外层容器：全屏高度(min-h-screen)，灰色背景(bg-gray-50)，居中显示(flex items-center justify-center)
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      
      {/* 卡片容器：白色背景，圆角，阴影 */}
      <div className="bg-white w-full max-w-md rounded-xl shadow-lg overflow-hidden border border-gray-100">
        
        {/* --- 顶部切换栏 --- */}
        <div className="flex border-b border-gray-100">
          {/* 登录按钮 */}
          <button
            onClick={() => toggleMode('login')}
            className={`flex-1 py-4 text-sm font-medium transition-colors ${
              mode === 'login' 
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/30' // 选中状态样式
                : 'text-gray-500 hover:text-gray-700' // 未选中状态样式
            }`}
          >
            登录
          </button>
          {/* 注册按钮 */}
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
            
            {/* 账号输入框 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {mode === 'login' ? '账号' : '手机号 或 邮箱'}
              </label>
              <div className="relative">
                {/* 左侧的小图标 */}
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

            {/* 错误提示框 (只有当 error 有值时才显示) */}
            {error && (
              <div className="text-red-500 text-sm bg-red-50 p-2 rounded border border-red-100">
                {error}
              </div>
            )}

            {/* 提交按钮 */}
            <button
              type="submit"
              disabled={loading} // 加载中时禁用按钮
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
    </div>
  );
}