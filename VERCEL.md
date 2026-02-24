# 🚀 Deploy na Vercel

## ⚠️ AVISO IMPORTANTE

A Vercel é uma plataforma **serverless** e tem limitações:

❌ **NÃO funciona bem para este projeto porque:**
- Não tem sistema de arquivos persistente
- Não consegue salvar o `votes.json` permanentemente
- Não consegue ler fotos da pasta local
- Cada requisição cria uma nova instância

## ✅ Alternativas Recomendadas

### 1. **Railway** (Melhor opção - gratuito)
```bash
# Instalar Railway CLI
npm i -g @railway/cli

# Login
railway login

# Deploy
railway init
railway up
```
- ✅ Suporta containers Docker
- ✅ Volumes persistentes
- ✅ 500h grátis/mês

### 2. **Render** (Também gratuito)
1. Acesse https://render.com
2. Conecte seu GitHub
3. Crie um "Web Service"
4. Selecione o repositório
5. Deploy automático!

### 3. **Fly.io** (Gratuito para pequenos apps)
```bash
# Instalar Fly CLI
curl -L https://fly.io/install.sh | sh

# Login e deploy
fly auth login
fly launch
fly deploy
```

### 4. **DigitalOcean App Platform**
- $5/mês
- Suporta Docker
- Volumes persistentes

### 5. **VPS Tradicional** (Mais controle)
- DigitalOcean Droplet ($4/mês)
- Linode ($5/mês)
- Vultr ($3.50/mês)

Use o arquivo `DOCKER.md` para deploy em qualquer VPS!

---

## 🤔 Se ainda quiser tentar Vercel

**Você precisaria:**
1. Usar um banco de dados externo (MongoDB, PostgreSQL)
2. Hospedar as fotos em storage externo (Cloudinary, AWS S3)
3. Reescrever grande parte do código

**Não recomendo** para este projeto específico.

---

## 🎯 Recomendação Final

Use **Railway** ou **Render** - são gratuitos e funcionam perfeitamente com este app!

### Deploy rápido com Railway:
```bash
npm i -g @railway/cli
railway login
railway init
railway up

# Adicionar suas fotos
railway run bash
# Dentro do container: cole as fotos em public/photos/
```

### Deploy rápido com Render:
1. Push o código pro GitHub
2. Conecte no Render.com
3. Deploy automático
4. Use o dashboard para fazer upload das fotos
