// Role policy tests (pure logic, no database needed).
import test from 'node:test';
import assert from 'node:assert/strict';
import { canAccess, buildAcl } from '../src/security/acl.js';
import { ROLES, SELF_SIGNUP_ROLES, APPROVAL_REQUIRED, APPROVERS } from '../src/config/roles.js';

const U = (username, role) => ({ username, role });
const general = { department: 'GENERAL', allowedRoles: [], allowedUsers: [] };
const hrDoc = { department: 'HR', allowedRoles: [], allowedUsers: [] };
const finDoc = { department: 'FINANCE', allowedRoles: [], allowedUsers: [] };

test('EMPLOYEE never sees HR documents and only sees private uploads that are theirs', () => {
  assert.equal(canAccess(U('u', 'EMPLOYEE'), hrDoc), false);
  assert.equal(canAccess(U('u', 'EMPLOYEE'), { department: 'GENERAL', allowedRoles: [], allowedUsers: ['u'] }), true, 'own private upload');
  assert.equal(canAccess(U('u', 'EMPLOYEE'), { department: 'GENERAL', allowedRoles: [], allowedUsers: ['someone'] }), false);
});

test('EMPLOYEE reads GENERAL only; HR reads HR + GENERAL but not FINANCE', () => {
  assert.equal(canAccess(U('e', 'EMPLOYEE'), general), true);
  assert.equal(canAccess(U('e', 'EMPLOYEE'), hrDoc), false);
  assert.equal(canAccess(U('h', 'HR'), hrDoc), true);
  assert.equal(canAccess(U('h', 'HR'), finDoc), false);
  assert.equal(canAccess(U('a', 'ADMIN'), finDoc), true);
});

test('only ADMIN / HR / FINANCE may share documents; EMPLOYEE can only upload private ones', () => {
  for (const role of ['EMPLOYEE']) {
    assert.throws(() => buildAcl(U('x', role), { department: 'GENERAL', access: 'department' }), /private/i);
    assert.deepEqual(buildAcl(U('x', role), { department: 'GENERAL', access: 'private' }).acl.allowedUsers, ['x']);
  }
  assert.ok(buildAcl(U('h', 'HR'), { department: 'HR', access: 'department' }));
  assert.throws(() => buildAcl(U('h', 'HR'), { department: 'FINANCE', access: 'department' }), /cannot add/i);
});

test('sign-up policy: only Employee / HR / Finance can be requested, all need approval; HR and Finance need an admin', () => {
  assert.ok(!SELF_SIGNUP_ROLES.includes(ROLES.ADMIN));
  assert.deepEqual([...SELF_SIGNUP_ROLES].sort(), ['EMPLOYEE', 'FINANCE', 'HR']);
  assert.deepEqual([...APPROVAL_REQUIRED].sort(), ['EMPLOYEE', 'FINANCE', 'HR']);
  assert.deepEqual(APPROVERS.HR, ['ADMIN']);
  assert.deepEqual(APPROVERS.FINANCE, ['ADMIN']);
  assert.deepEqual(APPROVERS.EMPLOYEE.sort(), ['ADMIN', 'HR']);
});

test('ADMIN can read everything, including other people\'s private uploads and every department', () => {
  const A = U('admin', 'ADMIN');
  assert.equal(canAccess(A, { department: 'GENERAL', allowedRoles: [], allowedUsers: ['employee01'] }), true, 'employee private file');
  assert.equal(canAccess(A, { department: 'GENERAL', allowedRoles: [], allowedUsers: ['finance01'] }), true, 'finance private file');
  assert.equal(canAccess(A, { department: 'HR', allowedRoles: ['HR'], allowedUsers: [] }), true, 'HR-only file');
  assert.equal(canAccess(A, finDoc), true);
});
