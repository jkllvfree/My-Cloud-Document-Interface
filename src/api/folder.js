import { request } from '@/utils/request';

export const folderService = {
  // 获取指定文件夹的内容 (如果是 null，后端应该处理为获取根目录)
  getContent: (folderId = null) => {
    const query = folderId ? `?currentFolderId=${folderId}` : '';
    return request(`/folder/content${query}`);
  },

  // 创建文件夹
  createFolder: ({name, parentId}) => {
    return request('/folder/create', {
      method: 'POST',
      body: JSON.stringify({ name, parentId }), 
    });
  },

  // 创建文档 (复用 document 接口，但放在这里方便文件树调用)
  createDocument: ({name, folderId, content}) => {
    return request('/document/create', { 
      method: 'POST',
      body: JSON.stringify({ 
        name, 
        folderId, 
        content 
      }), 
    });
  }
};