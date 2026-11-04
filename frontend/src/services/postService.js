import api from './api';

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
    const { data } = await api.post('/posts', payload);
    return data;
  },
  async update(id, payload) {
    const { data } = await api.put(`/posts/${id}`, payload);
    return data;
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
