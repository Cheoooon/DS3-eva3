#!/usr/bin/env bash
set -e

if [ ! -f .env ]; then
  echo "❌ Error: El archivo .env no existe. Crea uno basado en .env.example"
  exit 1
fi

# Cargar variables de entorno
set -a
source .env
set +a

# Asegurar que los procesos secundarios mueran al presionar Ctrl+C
trap 'kill 0' EXIT

start_dev() {
  echo "🚀 Iniciando modo DESARROLLO..."
  
  docker compose up -d

  echo "⏳ Esperando que PostgreSQL esté listo..."
  until docker compose exec -T db pg_isready -U "$POSTGRES_USER" -d "$POSTGRES_DB" > /dev/null 2>&1; do
    sleep 1
  done
  echo "✅ Base de datos lista."

  echo "📦 Verificando y aplicando migraciones de Prisma..."
  pnpm --filter backend run prisma:migrate:dev

  if [ "$SHOULD_SEED" = true ]; then
    seed
  fi

  echo "🌐 Iniciando Backend ($BACKEND_PORT) y Frontend ($FRONTEND_PORT)..."

  export PORT=${BACKEND_PORT}
  pnpm --filter backend run start:dev &

  export PORT=${FRONTEND_PORT}
  pnpm --filter frontend run dev &
  
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

  echo "📦 Aplicando migraciones pendientes (Producción)..."

  pnpm --filter backend run prisma:deploy
  pnpm --filter backend run prisma:generate

  echo "🏗️ Construyendo aplicaciones..."
  pnpm --filter backend run build
  pnpm --filter frontend run build
  
  export PORT=${BACKEND_PORT}
  pnpm --filter backend run start &

  export PORT=${FRONTEND_PORT}
  pnpm --filter frontend run start &
  
  wait
}

seed() {
  echo "🌱 Poblando base de datos con datos de prueba..."
  pnpm --filter backend run prisma:seed
  echo "✅ Seed completado."
}

# Parsear argumentos
COMMAND="$1"
shift
SHOULD_SEED=false
for arg in "$@"; do
  if [[ "$arg" == "--seed" ]]; then
    SHOULD_SEED=true
  fi
done

case "$COMMAND" in
  dev)
    start_dev
    ;;
  prod)
    start_prod
    ;;
  *)
    echo "Uso: $0 {dev|prod} [--seed]"
    exit 1
    ;;
esac