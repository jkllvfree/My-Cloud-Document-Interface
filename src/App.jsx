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

  // ✨ 核心修复：更新用户信息的函数
  const handleUpdateUser = (newInfo) => {
    console.log("App 更新用户信息:", newInfo);
    
    // 🛠️ 修复点 1：使用正确的 setter (setUser)
    setUser(newInfo); 
    
    // 同步更新 localStorage
    localStorage.setItem('user', JSON.stringify(newInfo)); 
  };

  return (
    <div>
      {user ? (
        // 🛠️ 修复点 2：一定要把 onUpdateUser 传进去！
        <HomePage 
          currentUser={user} 
          onLogout={handleLogout} 
          onUpdateUser={handleUpdateUser} // <--- 关键！
        />
      ) : (
        <AuthPage onLoginSuccess={handleLoginSuccess} />
      )}
    </div>
  );
}

export default App;