import api from './api';

export const questionService = {
  async list({ search = '', page = 0, size = 12 } = {}) {
    const { data } = await api.get('/questions', { params: { search, page, size } });
    return data;
  },
  async get(id) {
    const { data } = await api.get(`/questions/${id}`);
    return data;
  },
  async create(payload) {
    const { data } = await api.post('/questions', payload);
    return data;
  },
  async answer(questionId, payload) {
    const { data } = await api.post(`/questions/${questionId}/answers`, payload);
    return data;
  },
  async remove(id) {
    const { data } = await api.delete(`/questions/${id}`);
    return data;
  },
  async removeAnswer(id) {
    const { data } = await api.delete(`/answers/${id}`);
    return data;
  },
  async adminRemove(id) {
    const { data } = await api.delete(`/admin/questions/${id}`);
    return data;
  },
};
