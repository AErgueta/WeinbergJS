#!/usr/bin/env bash

echo "🛠 Instalando Puppeteer y Chromium..."

# Asegura que Puppeteer descargue Chromium incluso en ambientes donde lo salta
export PUPPETEER_SKIP_DOWNLOAD=false

# Instala Puppeteer (reinstala si ya está)
npm install puppeteer

# Verifica si se descargó el ejecutable
if [ -f node_modules/puppeteer/.local-chromium/*/chrome-linux/chrome ]; then
    echo "✅ Chromium descargado correctamente."
else
    echo "⚠️ No se encontró Chromium, forzando descarga manual..."
    npx puppeteer install
fi

echo "🎉 Puppeteer está listo con Chromium."
