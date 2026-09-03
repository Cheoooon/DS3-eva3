#!/usr/bin/env bash
set -e

# Cargar variables de entorno
set -a
source .env
set +a

start_dev() {
  echo "🚀 Iniciando modo DESARROLLO..."
  docker compose up -d

  echo "⏳ Esperando que PostgreSQL esté listo..."
  until docker compose exec -T db pg_isready -U "$POSTGRES_USER" -d "$POSTGRES_DB" > /dev/null 2>&1; do
    sleep 1
  done
  echo "✅ Base de datos lista."

  echo "📦 Sincronizando esquema de Prisma..."
  pnpm --filter backend run prisma:push --skip-generate > /dev/null 2>&1 || true
  pnpm --filter backend run prisma:generate > /dev/null 2>&1

  echo "🌐 Iniciando Backend ($BACKEND_PORT) y Frontend ($FRONTEND_PORT)..."

  export PORT=${BACKEND_PORT}
  pnpm --filter backend run start:dev &

  export PORT=${FRONTEND_PORT}
  pnpm --filter frontend run dev
}

start_prod() {
  echo "🚀 Iniciando modo PRODUCCIÓN..."
  pnpm --filter backend run build
  pnpm --filter frontend run build
  
  export PORT=${BACKEND_PORT}
  pnpm --filter backend run start &

  export PORT=${FRONTEND_PORT}
  pnpm --filter frontend run start
}

case "$1" in
  dev)
    start_dev
    ;;
  prod)
    start_prod
    ;;
  *)
    echo "Uso: $0 {dev|prod}"
    exit 1
    ;;
esac
