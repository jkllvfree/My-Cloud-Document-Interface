const BASE_URL = 'http://localhost:8080/api/document';

export const documentService = {
  // 获取文档详情
  getDetail: async (docId) => {
    const response = await fetch(`${BASE_URL}/detail/${docId}`);
    return response.json();
  },

  // 更新文档信息 (重命名 或 保存内容)
  // 如果只重命名，newContent 传 null；如果只保存内容，newName 传 null
  updateInfo: async ({ id, newName = null, newContent = null }) => {
    const response = await fetch(`${BASE_URL}/update/info`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, newName, newContent }),
    });
    return response.json();
  }
};