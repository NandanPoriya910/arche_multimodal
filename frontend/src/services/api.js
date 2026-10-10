// api.js keeps ALL backend calls in one place.
const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/+$/, '');

// ── token storage ──
// Session-only on purpose: the token lives in sessionStorage, so closing the tab/browser signs you out,
// and nothing is remembered between runs of the project. (Any token left in localStorage by an older
// version is deleted.)
localStorage.removeItem('token');
export const tokenStore = {
  get: () => sessionStorage.getItem('token'),
  set(token) {
    sessionStorage.setItem('token', token);
  },
  clear() {
    localStorage.removeItem('token');
    sessionStorage.removeItem('token');
  },
};

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

async function request(path, { method = 'GET', body, form, raw = false } = {}) {
  const headers = {};
  const token = tokenStore.get();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  let res;
  try {
    res = await fetch(`${API_URL}${path}`, { method, headers, body: form ?? (body !== undefined ? JSON.stringify(body) : undefined) });
  } catch {
    throw new ApiError('Cannot reach the server. Is the backend running?', 0);
  }
  if (raw && res.ok) return res;

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401 && token && !path.startsWith('/auth/login')) window.dispatchEvent(new Event('auth:expired'));
    throw new ApiError(data.error || `Request failed (${res.status})`, res.status);
  }
  return data;
}

export const api = {
  // auth
  login: (identifier, password) => request('/auth/login', { method: 'POST', body: { identifier, password } }),
  signup: (payload) => request('/auth/signup', { method: 'POST', body: payload }),
  googleConfig: () => request('/auth/google/config'),
  googleLogin: (credential, accountType) => request('/auth/google', { method: 'POST', body: { credential, accountType } }),
  me: () => request('/auth/me'),
  changePassword: (currentPassword, newPassword) => request('/auth/change-password', { method: 'POST', body: { currentPassword, newPassword } }),

  // chats
  listChats: () => request('/chats'),
  createChat: () => request('/chats', { method: 'POST', body: {} }),
  getChat: (id) => request(`/chats/${id}`),
  renameChat: (id, title) => request(`/chats/${id}`, { method: 'PATCH', body: { title } }),
  deleteChat: (id) => request(`/chats/${id}`, { method: 'DELETE' }),
  sendMessage: (id, content, model) => request(`/chats/${id}/messages`, { method: 'POST', body: { content, ...(model ? { provider: model.provider, model: model.model } : {}) } }),

  // providers (admin) + available models (everyone)
  availableModels: () => request('/providers/available'),
  listProviders: () => request('/providers'),
  saveProvider: (id, payload) => request(`/providers/${id}`, { method: 'PUT', body: payload }),
  removeProviderKey: (id) => request(`/providers/${id}/key`, { method: 'DELETE' }),
  testProvider: (id) => request(`/providers/${id}/test`, { method: 'POST' }),
  fetchProviderModels: (id) => request(`/providers/${id}/models`, { method: 'POST' }),
  saveDefaultModels: (payload) => request('/providers/defaults/models', { method: 'PUT', body: payload }),

  // admin
  adminStats: () => request('/admin/stats'),
  adminUsers: (q = '') => request(`/admin/users?q=${encodeURIComponent(q)}`),
  adminCreateUser: (b) => request('/admin/users', { method: 'POST', body: b }),
  adminImportUsers: (file) => { const form = new FormData(); form.append('file', file); return request('/admin/users/import', { method: 'POST', form }); },
  adminUsersTemplate: async () => {
    const res = await request('/admin/users/import-template', { raw: true });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(await res.blob());
    a.download = 'users-template.csv';
    a.click();
  },
  adminUpdateUser: (id, b) => request(`/admin/users/${id}`, { method: 'PATCH', body: b }),
  adminChats: (qs = '') => request(`/admin/chats?${qs}`),
  adminChat: (id) => request(`/admin/chats/${id}`),
  adminDeleteChat: (id) => request(`/admin/chats/${id}`, { method: 'DELETE' }),
  adminDocs: (qs = '') => request(`/admin/documents?${qs}`),
  adminDocContent: (id, skip = 0) => request(`/admin/documents/${id}/content?limit=50&skip=${skip}`),
  adminDeleteDoc: (id) => request(`/admin/documents/${id}`, { method: 'DELETE' }),
  adminOpenDoc: async (id) => {
    const res = await request(`/admin/documents/${id}/file`, { raw: true });
    window.open(URL.createObjectURL(await res.blob()), '_blank', 'noopener');
  },
  adminAudit: (qs = '') => request(`/admin/audit?${qs}`),

  adminPending: () => request('/admin/pending'),
  adminDecide: (id, approve) => request(`/admin/pending/${id}/${approve ? 'approve' : 'reject'}`, { method: 'POST' }),

  // hr dashboard (HR + admin)
  hrOverview: () => request('/hr/overview'),
  hrPending: () => request('/hr/pending'),
  hrDecide: (id, approve) => request(`/hr/pending/${id}/${approve ? 'approve' : 'reject'}`, { method: 'POST' }),
  hrEmployees: (q = '') => request(`/hr/employees?q=${encodeURIComponent(q)}`),
  hrUpdateEmployee: (id, b) => request(`/hr/employees/${id}`, { method: 'PATCH', body: b }),
  hrDocuments: () => request('/hr/documents'),

  // employee dashboard
  employeeOverview: () => request('/employee/overview'),

  // knowledge base
  listDocuments: () => request('/knowledge/documents'),
  kbStatus: () => request('/knowledge/status'),
  uploadDocument: (file, fields) => {
    const form = new FormData();
    form.append('file', file);
    Object.entries(fields).forEach(([k, v]) => v !== undefined && v !== '' && form.append(k, Array.isArray(v) ? JSON.stringify(v) : v));
    return request('/knowledge/upload', { method: 'POST', form });
  },
  deleteDocument: (id) => request(`/knowledge/documents/${id}`, { method: 'DELETE' }),
  openDocument: async (id) => {
    const res = await request(`/knowledge/documents/${id}/file`, { raw: true });
    const blob = await res.blob();
    window.open(URL.createObjectURL(blob), '_blank', 'noopener');
  },
  reindex: () => request('/knowledge/reindex', { method: 'POST' }),
  loadSampleData: () => request('/knowledge/sample-data', { method: 'POST' }),
};
