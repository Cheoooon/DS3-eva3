#!/usr/bin/env bash
set -e

echo "🚀 Iniciando base de datos en Docker..."
docker compose up -d

echo "⏳ Esperando que PostgreSQL esté listo..."
until docker compose exec -T db pg_isready -U user -d practices_db > /dev/null 2>&1; do
  sleep 1
done
echo "✅ Base de datos lista."

echo "📦 Sincronizando esquema de Prisma..."
pnpm --filter backend run prisma:push --skip-generate > /dev/null 2>&1 || true
pnpm --filter backend run prisma:generate > /dev/null 2>&1

echo "🌐 Iniciando Backend (http://localhost:3000) y Frontend (http://localhost:3001)..."
pnpm dev
