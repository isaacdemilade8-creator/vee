#!/bin/sh
set -eu

APP_PUBLIC_STORAGE="/app/storage/app/public"
VOLUME_STORAGE="${RAILWAY_VOLUME_MOUNT_PATH:-$APP_PUBLIC_STORAGE}"

mkdir -p \
  bootstrap/cache \
  storage/framework/cache \
  storage/framework/sessions \
  storage/framework/views \
  storage/logs \
  "$(dirname "$APP_PUBLIC_STORAGE")" \
  "$VOLUME_STORAGE"

if [ "$VOLUME_STORAGE" != "$APP_PUBLIC_STORAGE" ]; then
  rm -rf "$APP_PUBLIC_STORAGE"
  ln -snf "$VOLUME_STORAGE" "$APP_PUBLIC_STORAGE"
fi

rm -rf public/storage

php artisan config:clear || true

if [ "${RUN_MIGRATIONS:-true}" = "true" ]; then
  php artisan migrate --force
fi

exec php -S 0.0.0.0:${PORT:-8080} -t public server.php
