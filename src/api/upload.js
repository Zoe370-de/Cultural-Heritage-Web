import api from './index.js';

export const uploadImage = (imageBase64, filename) =>
  api.post('/upload/image', { image: imageBase64, filename });