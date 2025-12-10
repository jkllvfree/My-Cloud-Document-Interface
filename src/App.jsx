import React, { useState } from 'react';
import AuthPage from './pages/AuthPage';
import HomePage from './pages/HomePage';

function App() {
  // 定义状态：user
  const [user, setUser] = useState(null);

  // 登录成功回调
  const handleLoginSuccess = (userData) => {
    console.log("App组件收到了用户信息:", userData);
    setUser(userData); 
    // 建议登录成功也存一下 localStorage，防止刷新丢失
    localStorage.setItem('user', JSON.stringify(userData));
  };

  // 退出登录
  const handleLogout = () => {
    setUser(null); 
    localStorage.removeItem('user'); // 记得清除缓存
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