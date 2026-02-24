#!/bin/bash

echo "🔄 Sincronizando fotos com Fly.io"
echo "================================="
echo ""

# Verificar se a pasta local existe
if [ ! -d "public/photos" ]; then
  echo "❌ Pasta public/photos não encontrada"
  exit 1
fi

# Obter informações da máquina
APP_NAME="cat-rater"
echo "🔍 Conectando ao app $APP_NAME..."

# Função para sincronizar
sync_photos() {
  echo ""
  echo "📤 Sincronizando fotos..."
  
  # Usar flyctl ssh sftp para sincronizar
  flyctl ssh sftp shell <<EOF
cd /app/public/photos
lcd public/photos
mput *
bye
EOF

  if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Sincronização concluída!"
    echo "🌐 Acesse: https://$APP_NAME.fly.dev/"
  else
    echo ""
    echo "❌ Erro na sincronização"
  fi
}

# Menu
echo ""
echo "Escolha uma opção:"
echo "1) Sincronizar fotos agora"
echo "2) Sincronizar e monitorar mudanças (auto-sync)"
echo "3) Baixar fotos do servidor"
echo ""
read -p "Opção [1]: " option
option=${option:-1}

case $option in
  1)
    sync_photos
    ;;
  2)
    echo ""
    echo "👀 Monitorando pasta public/photos..."
    echo "   (Ctrl+C para parar)"
    echo ""
    
    # Sincronizar uma vez
    sync_photos
    
    # Monitorar mudanças (requer inotify-tools)
    if command -v inotifywait &> /dev/null; then
      while true; do
        inotifywait -r -e modify,create,delete public/photos/ 2>/dev/null
        echo "📝 Mudança detectada, sincronizando..."
        sleep 2
        sync_photos
      done
    else
      echo ""
      echo "⚠️  Para auto-sync instale: sudo apt install inotify-tools"
      echo "   Por enquanto, sincronizando a cada 30 segundos..."
      while true; do
        sleep 30
        sync_photos
      done
    fi
    ;;
  3)
    echo ""
    echo "📥 Baixando fotos do servidor..."
    flyctl ssh sftp shell <<EOF
cd /app/public/photos
lcd public/photos
mget *
bye
EOF
    echo "✅ Download concluído!"
    ;;
  *)
    echo "Opção inválida"
    exit 1
    ;;
esac
