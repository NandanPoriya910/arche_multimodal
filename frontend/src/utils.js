export const firstName = (name = '') => name.trim().split(/\s+/)[0] || 'there';
export const initials = (name = '') => {
  const p = name.trim().split(/\s+/).filter(Boolean);
  if (!p.length) return '?';
  return (p.length > 1 ? p[0][0] + p[1][0] : p[0].slice(0, 2)).toUpperCase();
};

export function formatWhen(iso) {
  const d = new Date(iso);
  const now = new Date();
  const time = d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  const startOf = (x) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const diffDays = Math.round((startOf(now) - startOf(d)) / 86400000);
  if (diffDays === 0) return `Today, ${time}`;
  if (diffDays === 1) return `Yesterday, ${time}`;
  return d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
}

export const formatBytes = (n = 0) => (n < 1024 ? `${n} B` : n < 1048576 ? `${(n / 1024).toFixed(1)} KB` : `${(n / 1048576).toFixed(1)} MB`);

export const ROLE_DEPARTMENTS = { ADMIN: ['HR', 'FINANCE', 'GENERAL'], HR: ['HR', 'GENERAL'], FINANCE: ['FINANCE', 'GENERAL'], EMPLOYEE: [] };

// Where each role lands after signing in, and which dashboard it owns.
export const ROLE_HOME = { ADMIN: '/admin', HR: '/hr', EMPLOYEE: '/employee', FINANCE: '/' };
export const ROLE_LABEL = { ADMIN: 'Admin', HR: 'HR', FINANCE: 'Finance', EMPLOYEE: 'Employee' };
