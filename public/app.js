const API_URL = window.location.origin;

// Elementos DOM
const photosGrid = document.getElementById('photosGrid');

// Carregar fotos
async function loadPhotos() {
  try {
    const response = await fetch(`${API_URL}/api/photos`);
    const photos = await response.json();
    
    if (photos.length === 0) {
      photosGrid.innerHTML = `
        <div class="empty-state">
          <h3>Nenhuma foto encontrada</h3>
          <p>📁 Coloque suas fotos (JPG, PNG, GIF, WEBP) na pasta <code>public/photos/</code></p>
          <p>Elas aparecerão aqui automaticamente!</p>
        </div>
      `;
      return;
    }
    
    // Ordenar por votos (ranking)
    photos.sort((a, b) => b.votes - a.votes);
    
    photosGrid.innerHTML = photos.map((photo, index) => `
      <div class="photo-card" data-id="${photo.id}">
        ${index < 3 ? `<div class="rank-badge ${['first', 'second', 'third'][index]}">#${index + 1}</div>` : ''}
        <img src="${photo.url}" alt="${photo.name}" onerror="this.src='https://via.placeholder.com/300x250?text=Imagem+não+encontrada'">
        <div class="photo-info">
          <div class="photo-name">${photo.name}</div>
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

// Votar em uma foto
async function vote(photoId) {
  const card = document.querySelector(`[data-id="${photoId}"]`);
  card.classList.add('voting');
  
  try {
    const response = await fetch(`${API_URL}/api/vote/${photoId}`, {
      method: 'POST',
    });
    
    if (response.ok) {
      setTimeout(() => {
        loadPhotos();
      }, 300);
    }
  } catch (error) {
    console.error('Erro ao votar:', error);
    alert('Erro ao votar. Tente novamente.');
  }
}

// Atualizar fotos automaticamente a cada 3 segundos
setInterval(loadPhotos, 3000);

// Carregar fotos ao iniciar
loadPhotos();
