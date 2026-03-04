const API_BASE = 'https://ai-industrial-backend-auth-production.up.railway.app';

function saveAuth(payload) {
  if (!payload) return;
  if (payload.token) localStorage.setItem('token', payload.token);
  if (payload.user) localStorage.setItem('currentUser', JSON.stringify(payload.user));
}

function getLocalRecords() {
  try {
    return JSON.parse(localStorage.getItem('records')) || [];
  } catch {
    return [];
  }
}

function setLocalRecords(records) {
  localStorage.setItem('records', JSON.stringify(records));
}

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
  const data = await res.json();
  saveAuth(data);

  try {
    const users = JSON.parse(localStorage.getItem('users')) || [];
    const exist = users.find(u => u.username === username);
    if (!exist) {
      users.push({ username, password, role });
      localStorage.setItem('users', JSON.stringify(users));
    }
  } catch {}

  return data;
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
  const data = await res.json();
  saveAuth(data);
  return data;
}

// 获取当前用户
async function apiGetCurrentUser(token) {
  const tk = token || localStorage.getItem('token');
  if (!tk) throw new Error('未登录');
  const res = await fetch(`${API_BASE}/api/me`, {
    headers: { 'Authorization': 'Bearer ' + tk }
  });
  if (!res.ok) throw new Error('未登录');
  const data = await res.json();
  if (data.user) {
    localStorage.setItem('currentUser', JSON.stringify(data.user));
    return data.user;
  }
  return data;
}

// 管理员获取所有用户
async function apiAdminListUsers(token) {
  const tk = token || localStorage.getItem('token');
  if (!tk) throw new Error('未登录');
  const res = await fetch(`${API_BASE}/api/users`, {
    headers: { 'Authorization': 'Bearer ' + tk }
  });
  if (!res.ok) throw new Error('无权限');
  const data = await res.json();
  return data.users || [];
}

// 管理员修改用户角色
async function apiAdminUpdateUser(userId, role, token) {
  const tk = token || localStorage.getItem('token');
  if (!tk) throw new Error('未登录');
  const roleValue = typeof role === 'string' ? role : role?.role;
  if (!roleValue) throw new Error('角色参数无效');
  const res = await fetch(`${API_BASE}/api/users/${userId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + tk },
    body: JSON.stringify({ role: roleValue })
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

async function apiUploadImage(file, desc) {
  const currentUser = await apiGetCurrentUser();
  const records = getLocalRecords();
  const record = {
    id: Date.now().toString(),
    username: currentUser.username,
    type: 'image',
    contentSummary: `图片：${file?.name || '未命名'}；说明：${desc || '无'}`,
    result: '已接收图片，待工业运维分析服务返回结果。',
    createdAt: new Date().toLocaleString()
  };
  records.unshift(record);
  setLocalRecords(records);
  return record;
}

async function apiUploadLog(text) {
  const currentUser = await apiGetCurrentUser();
  const records = getLocalRecords();
  const summary = (text || '').trim().slice(0, 60) || '空日志';
  const record = {
    id: Date.now().toString(),
    username: currentUser.username,
    type: 'log',
    contentSummary: summary,
    result: '日志已接收，待工业运维分析服务返回结果。',
    createdAt: new Date().toLocaleString()
  };
  records.unshift(record);
  setLocalRecords(records);
  return record;
}

async function apiAskQuestion(question) {
  const currentUser = await apiGetCurrentUser();
  const records = getLocalRecords();
  const summary = (question || '').trim().slice(0, 60) || '空问题';
  const answer = '问题已提交，待工业运维处理后返回详细建议。';
  const record = {
    id: Date.now().toString(),
    username: currentUser.username,
    type: 'question',
    contentSummary: summary,
    result: answer,
    createdAt: new Date().toLocaleString()
  };
  records.unshift(record);
  setLocalRecords(records);
  return { answer };
}

async function apiGetRecords() {
  await apiGetCurrentUser();
  return getLocalRecords();
}

async function apiDeleteCurrentAccount() {
  apiLogout();
  return { success: true };
}