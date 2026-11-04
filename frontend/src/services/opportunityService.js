import api from './api';

export const opportunityService = {
  async list({ search = '', category = '', upcomingOnly = true, page = 0, size = 50 } = {}) {
    const { data } = await api.get('/opportunities', {
      params: { search, category: category || undefined, upcomingOnly, page, size },
    });
    return data;
  },
  async create(payload) {
    const { data } = await api.post('/opportunities', payload);
    return data;
  },
  async update(id, payload) {
    const { data } = await api.put(`/opportunities/${id}`, payload);
    return data;
  },
  async remove(id) {
    const { data } = await api.delete(`/opportunities/${id}`);
    return data;
  },
};
