const API_BASE = 'http://ai-industrial-backend-auth-production.up.railway.app';

// 注册
async function apiRegister(username, password, role, adminSecret) {
  const body = { username, password, role };
  if (role === 'admin') body.adminSecret = adminSecret;
  const res = await fetch(`${API_BASE}/api/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || '注册失败');
  }
  return await res.json();
}

// 登录
async function apiLogin(username, password) {
  const res = await fetch(`${API_BASE}/api/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || '登录失败');
  }
  return await res.json();
}

// 获取当前用户
async function apiGetCurrentUser(token) {
  const tk = token || localStorage.getItem('token');
  if (!tk) throw new Error('未登录');
  const res = await fetch(`${API_BASE}/api/me`, {
    headers: { 'Authorization': 'Bearer ' + tk }
  });
  if (!res.ok) throw new Error('未登录');
  return await res.json();
}

// 管理员获取所有用户
async function apiAdminListUsers(token) {
  const tk = token || localStorage.getItem('token');
  if (!tk) throw new Error('未登录');
  const res = await fetch(`${API_BASE}/api/users`, {
    headers: { 'Authorization': 'Bearer ' + tk }
  });
  if (!res.ok) throw new Error('无权限');
  return await res.json();
}

// 管理员修改用户角色
async function apiAdminUpdateUser(userId, role, token) {
  const tk = token || localStorage.getItem('token');
  if (!tk) throw new Error('未登录');
  const res = await fetch(`${API_BASE}/api/users/${userId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + tk },
    body: JSON.stringify({ role })
  });
  if (!res.ok) throw new Error('无权限');
  return await res.json();
}

// 管理员删除用户
async function apiAdminDeleteUser(userId, token) {
  const tk = token || localStorage.getItem('token');
  if (!tk) throw new Error('未登录');
  const res = await fetch(`${API_BASE}/api/users/${userId}`, {
    method: 'DELETE',
    headers: { 'Authorization': 'Bearer ' + tk }
  });
  if (!res.ok) throw new Error('无权限');
  return await res.json();
}

// 登出
function apiLogout() {
  localStorage.removeItem('token');
  localStorage.removeItem('currentUser');
}