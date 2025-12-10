const BASE_URL = 'http://localhost:8080/api';

export const folderService = {
  // 获取指定文件夹的内容 (如果是 null，后端应该处理为获取根目录)
  getContent: async (folderId = null) => {
    // 构造 URL，如果 id 存在则拼上去，不存在则请求根目录
    const url = folderId 
      ? `${BASE_URL}/folder/content?currentFolderId=${folderId}`
      : `${BASE_URL}/folder/content`;
      
    const res = await fetch(url);
    return res.json();
  },

  // 创建文件夹
  createFolder: async (name, parentId, userId) => {
    const res = await fetch(`${BASE_URL}/folder/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'creator_id': userId.toString(),
      },
      body: JSON.stringify({ name, parentId }),
    });
    return res.json();
  },

  // 创建文档 (复用 document 接口，但放在这里方便文件树调用)
  createDocument: async (name, folderId, content, userId) => {
    const res = await fetch(`${BASE_URL}/document/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'creator_id': userId.toString(),
      },
      body: JSON.stringify({ name, folderId, content }),
    });
    return res.json();
  }
};