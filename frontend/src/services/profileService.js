import api from './api';

export const profileService = {
  async get() {
    const { data } = await api.get('/profile');
    return data;
  },
  async update(payload) {
    const { data } = await api.put('/profile', payload);
    return data;
  },
};

export const dashboardService = {
  async get() {
    const { data } = await api.get('/dashboard');
    return data;
  },
};

export const adminService = {
  async users({ search = '', role = '', page = 0, size = 50 } = {}) {
    const { data } = await api.get('/admin/users', {
      params: { search, role: role || undefined, page, size },
    });
    return data;
  },
};
