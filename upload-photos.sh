#!/bin/bash

echo "🐱 Adicionando fotos ao Cat Rater no Fly.io"
echo "============================================="
echo ""

# Verificar se há fotos na pasta local
if [ ! -d "public/photos" ] || [ -z "$(ls -A public/photos 2>/dev/null)" ]; then
  echo "❌ Nenhuma foto encontrada em public/photos/"
  echo "   Adicione suas fotos lá primeiro!"
  exit 1
fi

echo "📸 Fotos encontradas:"
ls -1 public/photos/
echo ""

# Obter o nome da máquina
echo "🔍 Encontrando máquina do Fly.io..."
MACHINE_ID=$(flyctl machines list --json | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -z "$MACHINE_ID" ]; then
  echo "❌ Erro: Não foi possível encontrar a máquina"
  exit 1
fi

echo "✅ Máquina encontrada: $MACHINE_ID"
echo ""

# Fazer upload das fotos
echo "📤 Enviando fotos..."
for file in public/photos/*; do
  if [ -f "$file" ]; then
    filename=$(basename "$file")
    echo "   → $filename"
    flyctl ssh sftp shell -C "put \"$file\" /app/public/photos/$filename"
  fi
done

echo ""
echo "✅ Fotos enviadas com sucesso!"
echo "🌐 Acesse: https://cat-rater.fly.dev/"
