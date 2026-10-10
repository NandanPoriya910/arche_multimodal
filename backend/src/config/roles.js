// roles.js: single source of truth for roles, department access and sign-up policy.

export const ROLES = {
  ADMIN: 'ADMIN',
  HR: 'HR',
  FINANCE: 'FINANCE',
  EMPLOYEE: 'EMPLOYEE',
};

// Partitions of the knowledge base. Each department has its own FAISS index.
export const DEPARTMENTS = ['HR', 'FINANCE', 'GENERAL'];

// Which departments' data each role may read by default.
export const ROLE_DEPARTMENTS = {
  ADMIN: ['HR', 'FINANCE', 'GENERAL'],
  HR: ['HR', 'GENERAL'],
  FINANCE: ['FINANCE', 'GENERAL'],
  EMPLOYEE: ['GENERAL'],
};

// ── Sign-up policy ────────────────────────────────────────────────────────────
// Which roles a person may REQUEST on the public sign-up form: Employee, HR or Finance. ADMIN is never self-service.
export const SELF_SIGNUP_ROLES = [ROLES.EMPLOYEE, ROLES.HR, ROLES.FINANCE];
// Every self-service role needs approval before the account can sign in.
//   EMPLOYEE requests can be approved by HR or ADMIN; HR and FINANCE requests only by ADMIN.
export const APPROVAL_REQUIRED = [ROLES.EMPLOYEE, ROLES.HR, ROLES.FINANCE];
export const APPROVERS = {
  [ROLES.EMPLOYEE]: [ROLES.HR, ROLES.ADMIN],
  [ROLES.HR]: [ROLES.ADMIN],
  [ROLES.FINANCE]: [ROLES.ADMIN],
};

export const ACCOUNT_STATUS = { ACTIVE: 'ACTIVE', PENDING: 'PENDING', REJECTED: 'REJECTED' };

// Roles that may upload documents shared with others (everyone else: private uploads only).
export const SHARING_ROLES = [ROLES.ADMIN, ROLES.HR, ROLES.FINANCE];
