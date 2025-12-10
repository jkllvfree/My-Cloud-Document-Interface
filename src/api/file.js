const BASE_URL = 'http://localhost:8080/api/file';

export const fileService = {
  uploadImage: async (file) => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${BASE_URL}/upload/image`, {
      method: 'POST',
      body: formData,
    });
    return response.json();
  }
};