FROM node:18-alpine
WORKDIR /app

# Instalar dependencias
COPY package.json ./
RUN npm install

# Copiar prisma schema y generar client
COPY prisma ./prisma
RUN npx prisma generate

# Copiar el resto del código y construir
COPY . .
RUN npx nest build

EXPOSE 3000
CMD ["node", "dist/main"]
