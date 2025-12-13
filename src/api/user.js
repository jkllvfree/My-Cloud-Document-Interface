import { request } from '@/utils/request';

export const userService = {
  getUserDetail: (userId) => {
    return request(`/user/detail/${userId}`);
  },

  // 获取自己的信息
  getMyInfo: () => {
    return request('/user/me');
  },

  // 更新头像 (注意：这里只传 URL 字符串给后端)
  updateAvatar: (avatarUrl) => {
    return request('/user/update/avatar', {
      method: 'POST',
      body: JSON.stringify({ avatarUrl })
    });
  },

  // 修改个人信息
  updateInfo: ({nickname, bio, phone, email}) => {
    return request('/user/update/info', {
      method: 'POST',
      body: JSON.stringify({ nickname, bio, phone, email })
    });
  },

  // 修改密码
  changePassword: ({oldPassword, newPassword}) => {
    return request('/user/change-password', {
      method: 'POST',
      body: JSON.stringify({ oldPassword, newPassword })
    });
  },

  // 模糊搜索用户 (通过昵称)
  searchUsers: (nickname) => {
    return request(`/user/search?nickname=${nickname}`);
  }
};