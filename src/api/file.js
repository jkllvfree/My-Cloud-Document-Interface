import { request } from '@/utils/request';

export const fileService = {
  uploadImage: async (file) => {
    const formData = new FormData();
    formData.append('file', file);

    return request('/file/upload/image', {
      method: 'POST',
      body: formData,
    });
  }

};
