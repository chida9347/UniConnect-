import api from './api';

export const noteService = {
  async list({ search = '', page = 0, size = 12 } = {}) {
    const { data } = await api.get('/notes', { params: { search, page, size } });
    return data;
  },
  async upload(formData) {
    const { data } = await api.post('/notes', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },
  async download(note) {
    const response = await api.get(`/notes/${note.id}/download`, { responseType: 'blob' });
    const url = URL.createObjectURL(response.data);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = note.originalFilename || 'study-note';
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  },
  async remove(id) {
    const { data } = await api.delete(`/notes/${id}`);
    return data;
  },
  async adminRemove(id) {
    const { data } = await api.delete(`/admin/notes/${id}`);
    return data;
  },
};
