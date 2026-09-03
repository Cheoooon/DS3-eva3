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

  echo "📦 Aplicando migraciones de Prisma..."
  pnpm --filter backend run prisma:migrate > /dev/null 2>&1
  pnpm --filter backend run prisma:generate > /dev/null 2>&1

  echo "🌐 Iniciando Backend ($BACKEND_PORT) y Frontend ($FRONTEND_PORT)..."

  export PORT=${BACKEND_PORT}
  pnpm --filter backend run start:dev &

  export PORT=${FRONTEND_PORT}
  pnpm --filter frontend run dev
  
  wait
}

start_prod() {
  echo "🚀 Iniciando modo PRODUCCIÓN..."

  docker compose up -d

  echo "⏳ Esperando que PostgreSQL esté listo..."
  until docker compose exec -T db pg_isready -U "$POSTGRES_USER" -d "$POSTGRES_DB" > /dev/null 2>&1; do
    sleep 1
  done
  echo "✅ Base de datos lista."

  pnpm --filter backend run prisma:migrate
  pnpm --filter backend run build
  pnpm --filter frontend run build
  
  export PORT=${BACKEND_PORT}
  pnpm --filter backend run start &

  export PORT=${FRONTEND_PORT}
  pnpm --filter frontend run start
  
  wait
}

seed() {
  echo "🌱 Poblando base de datos con datos de prueba..."
  docker compose exec -T db psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" < prisma/seed.sql
  echo "✅ Seed completado."
}

case "$1" in
  dev)
    start_dev
    ;;
  prod)
    start_prod
    ;;
  seed)
    seed
    ;;
  *)
    echo "Uso: $0 {dev|prod|seed}"
    exit 1
    ;;
esac
