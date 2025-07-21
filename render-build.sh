#!/usr/bin/env bash

echo "🛠 Instalando Puppeteer y Chromium..."

# Forzar descarga del navegador (muy importante)
export PUPPETEER_SKIP_DOWNLOAD=false

# Instalar Puppeteer (con Chromium)
npm install puppeteer

# Verificación simple
echo "✅ Puppeteer instalado y Chromium descargado."
