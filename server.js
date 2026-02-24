const express = require('express');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const multer = require('multer');

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const DATA_FILE = process.env.DATA_FILE || path.join(__dirname, 'votes.json');
const PHOTOS_DIR = process.env.PHOTOS_DIR || path.join(__dirname, 'public', 'photos');
const PENDING_UPLOADS_DIR = process.env.PENDING_UPLOADS_DIR || path.join(__dirname, 'data', 'pending-uploads');
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '***REMOVED***';
const ADMIN_SESSION_TTL_MS = 1000 * 60 * 60 * 12; // 12h
const IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.gif', '.webp']);
const adminSessions = new Map();

// Middleware
app.use(express.json());
app.use(express.static('public'));
// Se estiver atrás de proxy (ngrok, fly), confiaremos no X-Forwarded-For
app.set('trust proxy', true);

if (!fs.existsSync(PHOTOS_DIR)) {
  fs.mkdirSync(PHOTOS_DIR, { recursive: true });
}

if (!fs.existsSync(PENDING_UPLOADS_DIR)) {
  fs.mkdirSync(PENDING_UPLOADS_DIR, { recursive: true });
}

function normalizeIp(ip) {
  if (!ip) return 'unknown';
  const cleaned = String(ip).trim();
  if (cleaned.startsWith('::ffff:')) {
    return cleaned.replace('::ffff:', '');
  }
  return cleaned;
}

function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];

  if (forwarded) {
    const firstIp = String(forwarded).split(',')[0];
    return normalizeIp(firstIp);
  }

  return normalizeIp(req.ip || req.connection.remoteAddress || req.socket.remoteAddress);
}

function hasValidSameOrigin(req) {
  const host = req.get('host');
  if (!host) return false;

  const origin = req.get('origin');
  const referer = req.get('referer');
  const allowedOrigins = new Set([`http://${host}`, `https://${host}`]);

  if (origin && !allowedOrigins.has(origin)) {
    return false;
  }

  if (referer) {
    try {
      const refererOrigin = new URL(referer).origin;
      if (!allowedOrigins.has(refererOrigin)) {
        return false;
      }
    } catch (error) {
      return false;
    }
  }

  // Para browsers modernos, exige same-origin quando o header estiver presente
  const secFetchSite = req.get('sec-fetch-site');
  if (secFetchSite && secFetchSite !== 'same-origin' && secFetchSite !== 'none') {
    return false;
  }

  return true;
}

function makeId() {
  return Date.now().toString() + crypto.randomBytes(6).toString('hex');
}

function sanitizeDisplayName(value) {
  if (!value) return '';
  return String(value)
    .trim()
    .replace(/\s+/g, ' ')
    .slice(0, 60);
}

function createSafeFilename(name) {
  const base = String(name)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '') || 'foto';

  return `${base}-${Date.now()}`;
}

function getBearerToken(req) {
  const authHeader = req.get('authorization') || '';
  const parts = authHeader.split(' ');
  if (parts.length === 2 && parts[0].toLowerCase() === 'bearer') {
    return parts[1];
  }
  return '';
}

function createAdminSession() {
  const token = crypto.randomBytes(24).toString('hex');
  adminSessions.set(token, Date.now() + ADMIN_SESSION_TTL_MS);
  return token;
}

function requireAdmin(req, res, next) {
  const token = getBearerToken(req) || String(req.query?.token || '');
  const expiresAt = adminSessions.get(token);

  if (!expiresAt) {
    return res.status(401).json({ error: 'Não autorizado' });
  }

  if (Date.now() > expiresAt) {
    adminSessions.delete(token);
    return res.status(401).json({ error: 'Sessão expirada' });
  }

  next();
}

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => {
      cb(null, PENDING_UPLOADS_DIR);
    },
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname || '').toLowerCase();
      cb(null, `${makeId()}${ext}`);
    }
  }),
  limits: {
    fileSize: 8 * 1024 * 1024
  },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase();
    const isImageMime = String(file.mimetype || '').startsWith('image/');

    if (isImageMime && IMAGE_EXTENSIONS.has(ext)) {
      return cb(null, true);
    }

    cb(new Error('Apenas imagens JPG, PNG, GIF e WEBP são permitidas'));
  }
});

// Inicializar arquivo de dados se não existir
if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, JSON.stringify({ photos: [], lastVotes: {}, ipVotes: {}, pendingSubmissions: [] }, null, 2));
}

// Ler dados
function readData() {
  try {
    const data = fs.readFileSync(DATA_FILE, 'utf8');
    const parsed = JSON.parse(data);
    // Garantir defaults
    if (!parsed.photos) parsed.photos = [];
    if (!parsed.lastVotes) parsed.lastVotes = {};
    if (!parsed.ipVotes) parsed.ipVotes = {};
    if (!parsed.pendingSubmissions) parsed.pendingSubmissions = [];
    return parsed;
  } catch (error) {
    return { photos: [], lastVotes: {}, ipVotes: {}, pendingSubmissions: [] };
  }
}

// Salvar dados
function saveData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// GET - Obter todas as fotos e votos (sincroniza com pasta)
app.get('/api/photos', (req, res) => {
  const data = readData();

  // Pegar arquivos da pasta
  const filesInFolder = fs.readdirSync(PHOTOS_DIR)
    .filter(file => IMAGE_EXTENSIONS.has(path.extname(file).toLowerCase()));
  
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

// POST - Submeter foto para aprovação
app.post('/api/submissions', (req, res) => {
  if (!hasValidSameOrigin(req)) {
    return res.status(403).json({ error: 'Requisição bloqueada por segurança' });
  }

  upload.single('photo')(req, res, (uploadError) => {
    if (uploadError) {
      return res.status(400).json({ error: uploadError.message || 'Falha no upload da foto' });
    }

    const data = readData();
    const displayName = sanitizeDisplayName(req.body?.name);

    if (!displayName || displayName.length < 2) {
      if (req.file?.path && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).json({ error: 'Informe um nome com pelo menos 2 caracteres' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'Envie uma imagem para submissão' });
    }

    data.pendingSubmissions.push({
      id: makeId(),
      name: displayName,
      filename: req.file.filename,
      originalFilename: req.file.originalname,
      submittedAt: new Date().toISOString(),
      submitterIp: getClientIp(req)
    });

    saveData(data);
    return res.status(201).json({ message: 'Foto enviada! Aguarde aprovação do admin.' });
  });
});

// POST - Votar em uma foto
app.post('/api/vote/:id', (req, res) => {
  const { id } = req.params;
  const data = readData();

  if (!hasValidSameOrigin(req)) {
    return res.status(403).json({ error: 'Requisição bloqueada por segurança' });
  }
  
  const photo = data.photos.find(p => p.id === id);
  
  if (!photo) {
    return res.status(404).json({ error: 'Foto não encontrada' });
  }

  const ip = getClientIp(req);
  data.ipVotes = data.ipVotes || {};

  if (data.ipVotes[ip]) {
    return res.status(429).json({ error: 'Este IP já votou e não pode votar novamente' });
  }

  // Registrar voto
  photo.votes += 1;
  data.ipVotes[ip] = {
    photoId: id,
    votedAt: new Date().toISOString()
  };
  saveData(data);

  res.json(photo);
});

app.post('/api/admin/login', (req, res) => {
  if (!hasValidSameOrigin(req)) {
    return res.status(403).json({ error: 'Requisição bloqueada por segurança' });
  }

  const password = String(req.body?.password || '');
  if (password !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Senha inválida' });
  }

  const token = createAdminSession();
  return res.json({ token });
});

app.get('/api/admin/submissions', requireAdmin, (req, res) => {
  const data = readData();
  const pending = data.pendingSubmissions
    .filter(item => fs.existsSync(path.join(PENDING_UPLOADS_DIR, item.filename)))
    .sort((a, b) => new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime())
    .map(item => ({
      id: item.id,
      name: item.name,
      submittedAt: item.submittedAt,
      previewUrl: `/api/admin/submissions/${item.id}/photo`
    }));

  res.json(pending);
});

app.get('/api/admin/submissions/:id/photo', requireAdmin, (req, res) => {
  const data = readData();
  const submission = data.pendingSubmissions.find(item => item.id === req.params.id);

  if (!submission) {
    return res.status(404).json({ error: 'Submissão não encontrada' });
  }

  const pendingFilePath = path.join(PENDING_UPLOADS_DIR, submission.filename);
  if (!fs.existsSync(pendingFilePath)) {
    return res.status(404).json({ error: 'Arquivo da submissão não encontrado' });
  }

  res.sendFile(pendingFilePath);
});

app.post('/api/admin/submissions/:id/approve', requireAdmin, (req, res) => {
  if (!hasValidSameOrigin(req)) {
    return res.status(403).json({ error: 'Requisição bloqueada por segurança' });
  }

  const data = readData();
  const index = data.pendingSubmissions.findIndex(item => item.id === req.params.id);

  if (index === -1) {
    return res.status(404).json({ error: 'Submissão não encontrada' });
  }

  const submission = data.pendingSubmissions[index];
  const pendingFilePath = path.join(PENDING_UPLOADS_DIR, submission.filename);
  if (!fs.existsSync(pendingFilePath)) {
    data.pendingSubmissions.splice(index, 1);
    saveData(data);
    return res.status(404).json({ error: 'Arquivo da submissão não encontrado' });
  }

  const ext = path.extname(submission.filename).toLowerCase();
  const safeBaseName = createSafeFilename(submission.name);
  const approvedFilename = `${safeBaseName}${ext}`;
  const approvedFilePath = path.join(PHOTOS_DIR, approvedFilename);

  fs.renameSync(pendingFilePath, approvedFilePath);

  const photo = {
    id: makeId(),
    filename: approvedFilename,
    url: `/photos/${approvedFilename}`,
    name: submission.name,
    votes: 0,
    createdAt: new Date().toISOString()
  };

  data.photos.push(photo);
  data.pendingSubmissions.splice(index, 1);
  saveData(data);

  res.json(photo);
});

app.post('/api/admin/submissions/:id/reject', requireAdmin, (req, res) => {
  if (!hasValidSameOrigin(req)) {
    return res.status(403).json({ error: 'Requisição bloqueada por segurança' });
  }

  const data = readData();
  const index = data.pendingSubmissions.findIndex(item => item.id === req.params.id);

  if (index === -1) {
    return res.status(404).json({ error: 'Submissão não encontrada' });
  }

  const submission = data.pendingSubmissions[index];
  const pendingFilePath = path.join(PENDING_UPLOADS_DIR, submission.filename);
  if (fs.existsSync(pendingFilePath)) {
    fs.unlinkSync(pendingFilePath);
  }

  data.pendingSubmissions.splice(index, 1);
  saveData(data);

  res.json({ success: true });
});

app.get('/bemlocodasideia', (_req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// Iniciar servidor
function startServer(port) {
  const server = app.listen(port, () => {
    console.log(`🚀 Servidor rodando em http://localhost:${port}`);
    console.log(`📊 Dados salvos em: ${DATA_FILE}`);
  });

  server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
      const nextPort = port + 1;
      console.log(`⚠️ Porta ${port} em uso. Tentando porta ${nextPort}...`);
      startServer(nextPort);
      return;
    }

    throw error;
  });
}

startServer(PORT);
