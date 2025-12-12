// src/api/file.js
const BASE_URL = 'http://localhost:8080/api';

export const fileService = {
  uploadImage: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    
    // 1. 获取 Token
    const token = localStorage.getItem('token');

    const response = await fetch(`${BASE_URL}/file/upload/image`, {
      method: 'POST',
      headers: {
        // 2. 放入 Token
        'Authorization': token,
        // ⚠️ 关键：千万不要手写 Content-Type，让浏览器自己去算 boundary！
      },
      body: formData,
    });
    return response.json();
  }

};