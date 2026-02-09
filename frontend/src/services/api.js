import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Rack API
export const rackAPI = {
  getAll: () => api.get('/racks'),
  getById: (id) => api.get(`/racks/${id}`),
  create: (data) => api.post('/racks', data),
  update: (id, data) => api.put(`/racks/${id}`, data),
  delete: (id) => api.delete(`/racks/${id}`),
};

// Device API
export const deviceAPI = {
  getAll: (rackId = null) => {
    const params = rackId ? { rack_id: rackId } : {};
    return api.get('/devices', { params });
  },
  getById: (id) => api.get(`/devices/${id}`),
  create: (data) => api.post('/devices', data),
  update: (id, data) => api.put(`/devices/${id}`, data),
  delete: (id) => api.delete(`/devices/${id}`),
  checkHealth: (id, updateStatus = true) => api.post(`/devices/${id}/health-check?update_status=${updateStatus}`),
};

// Network API
export const networkAPI = {
  getAllConnections: () => api.get('/network/connections'),
  getConnectionById: (id) => api.get(`/network/connections/${id}`),
  createConnection: (data) => api.post('/network/connections', data),
  updateConnection: (id, data) => api.put(`/network/connections/${id}`, data),
  deleteConnection: (id) => api.delete(`/network/connections/${id}`),
};

export default api;
