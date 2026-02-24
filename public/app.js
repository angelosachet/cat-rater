const API_URL = window.location.origin;

// Elementos DOM
const photosGrid = document.getElementById('photosGrid');
const submissionForm = document.getElementById('submissionForm');
const submissionName = document.getElementById('submissionName');
const submissionPhoto = document.getElementById('submissionPhoto');
const submissionMessage = document.getElementById('submissionMessage');

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Carregar fotos
async function loadPhotos() {
  try {
    const response = await fetch(`${API_URL}/api/photos`);
    const photos = await response.json();
    
    if (photos.length === 0) {
      photosGrid.innerHTML = `
        <div class="empty-state">
          <h3>Nenhuma foto disponível no momento</h3>
          <p>Em breve teremos fotos para você votar!</p>
        </div>
      `;
      return;
    }
    
    // Ordenar por votos (ranking)
    photos.sort((a, b) => b.votes - a.votes);
    
    photosGrid.innerHTML = photos.map((photo, index) => `
      <div class="photo-card" data-id="${photo.id}">
        ${index < 3 ? `<div class="rank-badge ${['first', 'second', 'third'][index]}">#${index + 1}</div>` : ''}
        <div class="photo-image-wrap">
          <img src="${photo.url}" alt="${escapeHtml(photo.name)}" onerror="this.src='https://via.placeholder.com/300x250?text=Imagem+não+encontrada'">
          <div class="photo-name-badge">${escapeHtml(photo.name)}</div>
        </div>
        <div class="photo-info">
          <div class="photo-votes">
            <span class="votes-count">❤️ ${photo.votes}</span>
            <span class="rank">#${index + 1}</span>
          </div>
          <button class="vote-btn" onclick="vote('${photo.id}')">
            👍 Votar
          </button>
        </div>
      </div>
    `).join('');
  } catch (error) {
    console.error('Erro ao carregar fotos:', error);
    photosGrid.innerHTML = `
      <div class="loading">
        Erro ao carregar fotos. Verifique se o servidor está rodando.
      </div>
    `;
  }
}

function showSubmissionMessage(message, isError = false) {
  if (!submissionMessage) return;
  submissionMessage.textContent = message;
  submissionMessage.classList.toggle('error', isError);
  submissionMessage.classList.toggle('success', !isError);
}

async function submitPhoto(event) {
  event.preventDefault();

  if (!submissionForm || !submissionName || !submissionPhoto) return;

  const file = submissionPhoto.files && submissionPhoto.files[0];
  if (!file) {
    showSubmissionMessage('Selecione uma imagem para enviar.', true);
    return;
  }

  const formData = new FormData();
  formData.append('name', submissionName.value);
  formData.append('photo', file);

  try {
    showSubmissionMessage('Enviando foto...');

    const response = await fetch(`${API_URL}/api/submissions`, {
      method: 'POST',
      body: formData
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(payload.error || 'Não foi possível enviar a foto.');
    }

    showSubmissionMessage(payload.message || 'Foto enviada com sucesso!');
    submissionForm.reset();
  } catch (error) {
    console.error('Erro ao enviar foto:', error);
    showSubmissionMessage(error.message || 'Erro ao enviar foto.', true);
  }
}

// Votar em uma foto
async function vote(photoId) {
  const card = document.querySelector(`[data-id="${photoId}"]`);
  card.classList.add('voting');
  
  try {
    const response = await fetch(`${API_URL}/api/vote/${photoId}`, {
      method: 'POST',
      headers: {
        'X-Requested-With': 'XMLHttpRequest'
      }
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      throw new Error(payload.error || 'Não foi possível registrar seu voto.');
    }

    setTimeout(() => {
      loadPhotos();
    }, 300);
  } catch (error) {
    console.error('Erro ao votar:', error);
    alert(error.message || 'Erro ao votar. Tente novamente.');
  } finally {
    card.classList.remove('voting');
  }
}

// Atualizar fotos automaticamente a cada 3 segundos
setInterval(loadPhotos, 3000);

if (submissionForm) {
  submissionForm.addEventListener('submit', submitPhoto);
}

// Carregar fotos ao iniciar
loadPhotos();
