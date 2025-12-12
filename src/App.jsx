import React, { useState } from 'react';
import AuthPage from './pages/AuthPage';
import HomePage from './pages/HomePage';

function App() {
  // 定义状态：user
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  // 登录成功回调
  const handleLoginSuccess = (loginData) => {
    console.log("App组件收到了用户信息:", loginData);
    const { token, userInfo } = loginData;
    // 1. 核心：必须把 Token 单独存起来！(给 API 请求用)
    localStorage.setItem('token', token);
    // 2. 把用户信息存起来 (给 UI 显示用，比如头像、昵称)
    localStorage.setItem('user', JSON.stringify(userInfo));
    // 3. 更新 React 状态，让页面切换到 HomePage
    setUser(userInfo);
  };

  // 退出登录
  const handleLogout = () => {
    setUser(null); 
    localStorage.removeItem('user'); 
    localStorage.removeItem('token'); 
    window.location.reload(); 
  };

  
  const handleUpdateUser = (newInfo) => {
    console.log("App 更新用户信息:", newInfo);
    setUser(newInfo); 
    // 同步更新 localStorage
    localStorage.setItem('user', JSON.stringify(newInfo)); 
  };

  // 根据 user 状态渲染不同页面，有USER就是Home，没有就是Auth
  return (
    <div>
      {user ? (
        <HomePage 
          currentUser={user} 
          onLogout={handleLogout} 
          onUpdateUser={handleUpdateUser} 
        />
      ) : (
        <AuthPage onLoginSuccess={handleLoginSuccess} />
      )}
    </div>
  );
}

export default App;