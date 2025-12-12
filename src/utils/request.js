const BASE_URL = 'http://localhost:8080/api';

/**
 * 封装的 fetch 请求
 * @param {string} endpoint 接口地址 (例如 /folder/create)
 * @param {object} options fetch 配置项
 */
export const request = async (endpoint, options = {}) => {
  // 1. 自动获取 Token
  const token = localStorage.getItem('token');

  // 2. 组装默认 Header
  const defaultHeaders = {
    'Content-Type': 'application/json',
  };

  // 3. 如果有 Token，自动挂载到 Header
  if (token) {
    defaultHeaders['Authorization'] = token; // 注意：这里不需要 Bearer 前缀，因为你后端是直接解析的
  }

  // 4. 合并配置
  const config = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers, // 允许单独接口覆盖 Header
    },
  };

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, config);
    
    // 5. 处理 HTTP 错误状态 (如 401 token 过期)
    if (response.status === 401) {
      // Token 过期或无效，强制登出
      localStorage.removeItem('token');
      window.location.href = '/login'; // 或者触发一个全局事件
      return Promise.reject({ msg: '登录已过期，请重新登录' });
    }

    const resData = await response.json();
    return resData;

  } catch (error) {
    console.error('API Request Error:', error);
    return { code: 500, msg: '网络连接异常' };
  }
};