# 🐱 Cat Rater - Docker

## 🚀 Rodar com Docker Compose (Recomendado)

### 1. Adicione suas fotos
Coloque suas fotos na pasta `public/photos/`:
```bash
cp /caminho/das/suas/fotos/* public/photos/
```

### 2. Inicie o container
```bash
docker-compose up -d
```

O app estará rodando em `http://localhost:3000`

### 3. Ver logs
```bash
docker-compose logs -f
```

### 4. Parar
```bash
docker-compose down
```

---

## 🐳 Rodar com Docker (Manual)

### 1. Build da imagem
```bash
docker build -t cat-rater .
```

### 2. Rodar o container
```bash
docker run -d \
  --name cat-rater \
  -p 3000:3000 \
  -v $(pwd)/public/photos:/app/public/photos \
  -v $(pwd)/data:/app/data \
  cat-rater
```

---

## 📤 Deployar em servidor

### Opção 1: Usando Docker Hub

1. **Criar conta no Docker Hub** (https://hub.docker.com)

2. **Login**:
```bash
docker login
```

3. **Build e tag**:
```bash
docker build -t seu-usuario/cat-rater:latest .
```

4. **Push**:
```bash
docker push seu-usuario/cat-rater:latest
```

5. **No servidor**, rode:
```bash
# Criar diretórios
mkdir -p ~/cat-rater/photos ~/cat-rater/data

# Copiar fotos para o servidor
scp -r public/photos/* usuario@servidor:~/cat-rater/photos/

# Rodar container
docker run -d \
  --name cat-rater \
  -p 3000:3000 \
  -v ~/cat-rater/photos:/app/public/photos \
  -v ~/cat-rater/data:/app/data \
  --restart unless-stopped \
  seu-usuario/cat-rater:latest
```

### Opção 2: Transferir imagem diretamente

1. **Salvar imagem**:
```bash
docker save cat-rater > cat-rater.tar
```

2. **Copiar para servidor**:
```bash
scp cat-rater.tar usuario@servidor:/tmp/
```

3. **No servidor**:
```bash
# Carregar imagem
docker load < /tmp/cat-rater.tar

# Criar estrutura
mkdir -p ~/cat-rater/photos ~/cat-rater/data

# Rodar
docker run -d \
  --name cat-rater \
  -p 3000:3000 \
  -v ~/cat-rater/photos:/app/public/photos \
  -v ~/cat-rater/data:/app/data \
  --restart unless-stopped \
  cat-rater
```

### Opção 3: Git + Build no servidor

1. **No servidor**:
```bash
git clone seu-repositorio cat-rater
cd cat-rater

# Adicionar suas fotos
cp /caminho/fotos/* public/photos/

# Build e rodar
docker-compose up -d
```

---

## 🌐 Expor com ngrok (no servidor)

```bash
# Instalar ngrok no servidor
curl -s https://ngrok-agent.s3.amazonaws.com/ngrok.asc | \
  sudo tee /etc/apt/trusted.gpg.d/ngrok.asc >/dev/null && \
  echo "deb https://ngrok-agent.s3.amazonaws.com buster main" | \
  sudo tee /etc/apt/sources.list.d/ngrok.list && \
  sudo apt update && sudo apt install ngrok

# Autenticar (pegue o token em https://dashboard.ngrok.com)
ngrok config add-authtoken SEU_TOKEN

# Expor
ngrok http 3000
```

---

## 📁 Estrutura de Volumes

- `./public/photos` → Suas fotos (cole aqui os arquivos)
- `./data` → Arquivo votes.json (votos persistem)

Para adicionar mais fotos:
1. Cole na pasta `public/photos/`
2. Elas aparecem automaticamente no ranking!

---

## 🔧 Comandos Úteis

```bash
# Ver containers rodando
docker ps

# Parar container
docker stop cat-rater

# Iniciar container
docker start cat-rater

# Remover container
docker rm cat-rater

# Ver logs em tempo real
docker logs -f cat-rater

# Executar comando dentro do container
docker exec -it cat-rater sh
```

---

## 🎯 Exemplo completo de deploy

```bash
# 1. Build
docker build -t cat-rater .

# 2. Adicionar fotos
cp minhas-fotos/* public/photos/

# 3. Rodar
docker-compose up -d

# 4. Verificar
docker-compose logs -f

# 5. Acessar
curl http://localhost:3000
```

Pronto! 🎉
