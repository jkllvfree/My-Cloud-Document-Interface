import { request } from '@/utils/request';

export const documentService = {
  // 获取文档详情
  getDetail: (documentId) => {
    return request(`/document/detail/${documentId}`);
  },

  // 更新文档信息 (重命名 或 保存内容)
  updateInfo: ({id, name, content}) => {
    return request('/document/update/info', {
      method: 'POST',
      body: JSON.stringify({ documentId:id, name, content }),
    });
  }
};