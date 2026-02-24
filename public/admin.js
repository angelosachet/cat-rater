const API_URL = window.location.origin;
const STORAGE_KEY = 'catrater_admin_token';

const adminLogin = document.getElementById('adminLogin');
const adminDashboard = document.getElementById('adminDashboard');
const adminLoginForm = document.getElementById('adminLoginForm');
const adminPassword = document.getElementById('adminPassword');
const adminLoginMessage = document.getElementById('adminLoginMessage');
const adminStatus = document.getElementById('adminStatus');
const pendingGrid = document.getElementById('pendingGrid');
const adminLogout = document.getElementById('adminLogout');

let adminToken = sessionStorage.getItem(STORAGE_KEY) || '';

function showLoginMessage(message, isError = false) {
  adminLoginMessage.textContent = message;
  adminLoginMessage.classList.toggle('error', isError);
  adminLoginMessage.classList.toggle('success', !isError);
}

function showStatus(message, isError = false) {
  adminStatus.textContent = message;
  adminStatus.classList.toggle('error', isError);
  adminStatus.classList.toggle('success', !isError);
}

function setLoggedIn(loggedIn) {
  adminLogin.classList.toggle('hidden', loggedIn);
  adminDashboard.classList.toggle('hidden', !loggedIn);
}

async function adminFetch(url, options = {}) {
  const headers = options.headers || {};
  headers.Authorization = `Bearer ${adminToken}`;
  const response = await fetch(`${API_URL}${url}`, {
    ...options,
    headers
  });

  if (response.status === 401) {
    adminToken = '';
    sessionStorage.removeItem(STORAGE_KEY);
    setLoggedIn(false);
    throw new Error('Sessão de admin inválida ou expirada.');
  }

  return response;
}

function formatDate(value) {
  const date = new Date(value);
  return date.toLocaleString('pt-BR');
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

async function loadPendingSubmissions() {
  pendingGrid.innerHTML = '<div class="loading">Carregando submissões...</div>';

  try {
    const response = await adminFetch('/api/admin/submissions');
    const items = await response.json();

    if (!items.length) {
      pendingGrid.innerHTML = '<div class="empty-state"><h3>Nenhuma submissão pendente</h3><p>Tudo aprovado por enquanto.</p></div>';
      return;
    }

    pendingGrid.innerHTML = items.map(item => `
      <div class="pending-card" data-id="${item.id}">
        <img src="${API_URL}${item.previewUrl}?token=${encodeURIComponent(adminToken)}" alt="${escapeHtml(item.name)}">
        <div class="pending-info">
          <div class="pending-name">${escapeHtml(item.name)}</div>
          <div class="pending-date">Enviado em ${formatDate(item.submittedAt)}</div>
          <div class="pending-actions">
            <button class="btn btn-approve" data-action="approve" data-id="${item.id}">Aprovar</button>
            <button class="btn btn-reject" data-action="reject" data-id="${item.id}">Rejeitar</button>
          </div>
        </div>
      </div>
    `).join('');
  } catch (error) {
    console.error('Erro ao carregar submissões:', error);
    pendingGrid.innerHTML = '<div class="loading">Erro ao carregar submissões.</div>';
    showStatus(error.message || 'Erro ao carregar submissões.', true);
  }
}

async function handleLogin(event) {
  event.preventDefault();
  showLoginMessage('Entrando...');

  try {
    const response = await fetch(`${API_URL}/api/admin/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ password: adminPassword.value })
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(payload.error || 'Falha no login');
    }

    adminToken = payload.token;
    sessionStorage.setItem(STORAGE_KEY, adminToken);
    setLoggedIn(true);
    showStatus('Login realizado com sucesso.');
    await loadPendingSubmissions();
  } catch (error) {
    console.error('Erro no login:', error);
    showLoginMessage(error.message || 'Senha inválida.', true);
  }
}

async function handlePendingAction(event) {
  const target = event.target;
  if (!(target instanceof HTMLButtonElement)) return;

  const action = target.dataset.action;
  const id = target.dataset.id;
  if (!action || !id) return;

  target.disabled = true;

  try {
    const response = await adminFetch(`/api/admin/submissions/${id}/${action}`, {
      method: 'POST'
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(payload.error || 'Não foi possível concluir a ação.');
    }

    showStatus(action === 'approve' ? 'Foto aprovada com sucesso.' : 'Foto rejeitada.');
    await loadPendingSubmissions();
  } catch (error) {
    console.error('Erro ao processar submissão:', error);
    showStatus(error.message || 'Erro ao processar submissão.', true);
  } finally {
    target.disabled = false;
  }
}

function handleLogout() {
  adminToken = '';
  sessionStorage.removeItem(STORAGE_KEY);
  setLoggedIn(false);
  showLoginMessage('Sessão finalizada.');
}

adminLoginForm.addEventListener('submit', handleLogin);
pendingGrid.addEventListener('click', handlePendingAction);
adminLogout.addEventListener('click', handleLogout);

if (adminToken) {
  setLoggedIn(true);
  loadPendingSubmissions();
} else {
  setLoggedIn(false);
}
