import { request } from '@/utils/request';

export const permissionService = {
  /**
   * 创建权限记录
   * @param {string} documentId 文档ID
   * @param {string} userId 用户ID
   * @param {string} permissionTypeStr 权限类型 ("OWNER", "EDITOR", "VIEWER")
   */
  create: ({documentId, userId, permissionTypeStr}) => {
    return request('/permission/create', {
      method: 'POST',
      body: JSON.stringify({ documentId, userId, permissionTypeStr }),
    });
  },

  /**
   * 2. [新增] 获取某文档的成员列表
   * 假设后端接口是 /permission/members?docId=xxx
   */
  getMembers: (documentId) => {
    return request(`/permission/members?documentId=${documentId}`);
  },

  /**
   * 3. [新增] 移除协作者
   */
  remove: ({documentId, userId}) => {
    return request('/permission/delete', {
      method: 'POST',
      body: JSON.stringify({ documentId, userId }),
    });
  },

  /**
   * 4. [新增] 修改权限 (例如从 Viewer 改为 Editor)
   */
  update: ({documentId, userId, permissionTypeStr}) => {
    return request('/permission/update', {
      method: 'POST',
      body: JSON.stringify({ documentId, userId, permissionTypeStr }),
    });
  },


//添加成员
  addMember: ({documentId, userId, permissionTypeStr}) => {
    return request('/permission/addMember', {
      method: 'POST',
      body: JSON.stringify({ documentId, userId, permissionTypeStr }),
    });
  },
};