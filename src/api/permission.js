import { request } from '@/utils/request';

export const permissionService = {
  /**
   * 创建权限记录
   * @param {string} documentId 文档ID
   * @param {string} userId 用户ID
   * @param {string} permissionTypeStr 权限类型 ("OWNER", "EDITOR", "VIEWER")
   */
  create: (documentId, userId, permissionTypeStr) => {
    return request('/permission/create', {
      method: 'POST',
      body: JSON.stringify({ documentId, userId, permissionTypeStr }),
    });
  }
};