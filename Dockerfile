FROM node:18-alpine

WORKDIR /app

# Copiar package.json e instalar dependências
COPY package*.json ./
RUN npm install --production

# Copiar código da aplicação
COPY server.js ./
COPY public ./public

# Criar diretórios para dados persistentes
RUN mkdir -p /app/public/photos /app/data

# Expor porta
EXPOSE 3000

# Variável de ambiente para o arquivo de dados
ENV DATA_FILE=/app/data/votes.json

# Comando para iniciar
CMD ["node", "server.js"]
