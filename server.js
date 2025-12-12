const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = process.env.DATA_FILE || path.join(__dirname, 'votes.json');

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Inicializar arquivo de dados se não existir
if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, JSON.stringify({ photos: [] }, null, 2));
}

// Ler dados
function readData() {
  try {
    const data = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return { photos: [] };
  }
}

// Salvar dados
function saveData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// GET - Obter todas as fotos e votos (sincroniza com pasta)
app.get('/api/photos', (req, res) => {
  const data = readData();
  const photosDir = path.join(__dirname, 'public', 'photos');
  
  if (!fs.existsSync(photosDir)) {
    fs.mkdirSync(photosDir, { recursive: true });
  }
  
  // Pegar arquivos da pasta
  const filesInFolder = fs.readdirSync(photosDir)
    .filter(file => /\.(jpg|jpeg|png|gif|webp)$/i.test(file));
  
  // Adicionar novas fotos que estão na pasta mas não no JSON
  filesInFolder.forEach(filename => {
    const exists = data.photos.some(p => p.filename === filename);
    if (!exists) {
      data.photos.push({
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        filename,
        url: `/photos/${filename}`,
        name: filename.replace(/\.[^/.]+$/, ''), // Remove extensão
        votes: 0,
        createdAt: new Date().toISOString()
      });
    }
  });
  
  // Remover fotos do JSON que não existem mais na pasta
  data.photos = data.photos.filter(photo => {
    return filesInFolder.includes(photo.filename);
  });
  
  saveData(data);
  res.json(data.photos);
});

// POST - Votar em uma foto
app.post('/api/vote/:id', (req, res) => {
  const { id } = req.params;
  const data = readData();
  
  const photo = data.photos.find(p => p.id === id);
  
  if (!photo) {
    return res.status(404).json({ error: 'Foto não encontrada' });
  }
  
  photo.votes += 1;
  saveData(data);
  
  res.json(photo);
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
  console.log(`📊 Dados salvos em: ${DATA_FILE}`);
});
