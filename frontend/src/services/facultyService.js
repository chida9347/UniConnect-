import api from './api';

export const facultyService = {
  async list({ search = '', department = '', page = 0, size = 50 } = {}) {
    const { data } = await api.get('/faculty', { params: { search, department, page, size } });
    return data;
  },
  async departments() {
    const { data } = await api.get('/faculty/departments');
    return data;
  },
  async create(payload) {
    const { data } = await api.post('/faculty', payload);
    return data;
  },
  async update(id, payload) {
    const { data } = await api.put(`/faculty/${id}`, payload);
    return data;
  },
  async remove(id) {
    const { data } = await api.delete(`/faculty/${id}`);
    return data;
  },
};
