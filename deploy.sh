#!/bin/bash

echo "🐱 Cat Rater - Deploy Script"
echo "=============================="
echo ""

# Salvar imagem
echo "📦 Salvando imagem Docker..."
docker save cat-rater:latest | gzip > cat-rater-docker.tar.gz

echo "✅ Imagem salva em: cat-rater-docker.tar.gz"
echo ""
echo "📤 Para enviar ao servidor, use:"
echo "   scp cat-rater-docker.tar.gz usuario@servidor:/tmp/"
echo ""
echo "🚀 No servidor, execute:"
echo "   gunzip -c /tmp/cat-rater-docker.tar.gz | docker load"
echo "   mkdir -p ~/cat-rater/photos ~/cat-rater/data"
echo "   docker run -d --name cat-rater -p 3000:3000 \\"
echo "     -v ~/cat-rater/photos:/app/public/photos \\"
echo "     -v ~/cat-rater/data:/app/data \\"
echo "     --restart unless-stopped \\"
echo "     cat-rater:latest"
echo ""
echo "📁 Depois copie as fotos:"
echo "   scp -r public/photos/* usuario@servidor:~/cat-rater/photos/"
