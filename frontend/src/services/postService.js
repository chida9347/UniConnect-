import api from './api';

function imagePayload(payload) {
  const data = new FormData();
  data.append('title', payload.title);
  data.append('content', payload.content);
  (payload.images || []).forEach((file) => data.append('images', file));
  (payload.removedImageIds || []).forEach((id) => data.append('removedImageIds', id));
  return data;
}

function hasMedia(payload) {
  return Boolean((payload.images?.length || 0) > 0 || (payload.removedImageIds?.length || 0) > 0);
}

export const postService = {
  async list({ search = '', page = 0, size = 12, sort = 'newest' } = {}) {
    const { data } = await api.get('/posts', { params: { search, page, size, sort } });
    return data;
  },
  async get(id) {
    const { data } = await api.get(`/posts/${id}`);
    return data;
  },
  async create(payload) {
    const config = hasMedia(payload)
      ? { headers: { 'Content-Type': 'multipart/form-data' } }
      : undefined;
    const { data } = await api.post('/posts', hasMedia(payload) ? imagePayload(payload) : payload, config);
    return data;
  },
  async update(id, payload) {
    const config = hasMedia(payload)
      ? { headers: { 'Content-Type': 'multipart/form-data' } }
      : undefined;
    const { data } = await api.put(`/posts/${id}`, hasMedia(payload) ? imagePayload(payload) : payload, config);
    return data;
  },
  async removeImage(postId, imageId) {
    const { data } = await api.delete(`/posts/${postId}/images/${imageId}`);
    return data;
  },
  async imageBlob(imageId) {
    const response = await api.get(`/posts/images/${imageId}`, { responseType: 'blob' });
    return response.data;
  },
  async remove(id) {
    const { data } = await api.delete(`/posts/${id}`);
    return data;
  },
  async adminRemove(id) {
    const { data } = await api.delete(`/admin/posts/${id}`);
    return data;
  },
};
