# 🐱 Cat Rater - Ranking de Fotos com Votação

App para adicionar fotos e criar um ranking baseado em votos em tempo real.

## 🚀 Como usar

### 1. Instalar dependências
```bash
npm install
```

### 2. Adicionar suas fotos
Coloque suas fotos (JPG, PNG, GIF, WEBP) na pasta `public/photos/`

Exemplo:
```
public/photos/
  ├── gato1.jpg
  ├── gato2.png
  ├── cachorro.jpg
  └── foto-legal.webp
```

### 3. Iniciar o servidor
```bash
npm start
```

O servidor será iniciado em `http://localhost:3000`

### 4. Compartilhar com ngrok

Instale o ngrok se ainda não tiver:
```bash
# No Linux/Mac com snap
sudo snap install ngrok

# Ou baixe em https://ngrok.com/download
```

Execute o ngrok:
```bash
ngrok http 3000
```

O ngrok vai gerar uma URL pública (ex: `https://abc123.ngrok.io`) que você pode compartilhar com outras pessoas para votarem!

## 📱 Como funcionar

### Adicionar fotos:
1. Coloque arquivos de imagem na pasta `public/photos/`
2. As fotos aparecem automaticamente no ranking!
3. Para remover: apenas delete o arquivo da pasta

### Para os Votantes:
1. Acessam a URL (localhost ou ngrok)
2. Veem todas as fotos no ranking
3. Clicam em "Votar" para dar um voto
4. O ranking atualiza automaticamente a cada 3 segundos

## 💾 Armazenamento

- **Fotos**: Pasta `public/photos/` no seu PC
- **Votos**: Arquivo `votes.json` no seu PC

## 🎨 Funcionalidades

- ✅ Fotos carregadas automaticamente da pasta local
- ✅ Adicione fotos apenas colando na pasta `public/photos/`
- ✅ Remova fotos deletando da pasta
- ✅ Votar em fotos
- ✅ Ranking em tempo real
- ✅ Atualização automática a cada 3 segundos
- ✅ Badges para top 3 (🥇🥈🥉)
- ✅ Votos salvos em JSON local
- ✅ Interface responsiva e bonita
- ✅ Sincronização automática com a pasta

## 🛠️ Tecnologias

- Frontend: HTML, CSS, JavaScript puro
- Backend: Node.js + Express (apenas para servir arquivos e salvar JSON)
- Armazenamento: arquivos locais + JSON
