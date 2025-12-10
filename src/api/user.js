const BASE_URL = 'http://localhost:8080/api';

export const userService = {
  // 上传头像文件
  uploadAvatarFile: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch(`${BASE_URL}/file/upload/avatar`, {
      method: 'POST',
      body: formData,
    });
    return response.json();
  },

  // 更新用户头像链接
  updateUserAvatar: async (userId, avatarUrl) => {
    const response = await fetch(`${BASE_URL}/user/update-avatar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, avatarUrl }),
    });
    return response.json();
  },

  // 更新基本信息
  updateInfo: async (userId, { nickname, bio, phone, email }) => {
    const response = await fetch(`${BASE_URL}/user/update/info`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        newNickname: nickname,
        newBio: bio,
        newPhoneNum: phone,
        newEmail: email
      }),
    });
    return response.json();
  },

  // 修改密码
  changePassword: async (userId, oldPassword, newPassword) => {
    const response = await fetch(`${BASE_URL}/user/change-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, oldPassword, newPassword }),
    });
    return response.json();
  }
};