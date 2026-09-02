FROM node:18-alpine
WORKDIR /app

# Instalar dependencias usando npm
COPY package.json ./
RUN npm install

# Copiar el resto del código
COPY . .

# Construir el proyecto
RUN npm run build

EXPOSE 3000
CMD ["npm", "run", "start"]
