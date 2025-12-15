#!/bin/bash
# Script para desplegar en Google Cloud Run con soporte para Puppeteer
# Uso: ./scripts/deploy-cloud-run-puppeteer.sh

set -e

echo "🚀 Iniciando despliegue en Google Cloud Run con soporte Puppeteer..."

# Colores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Verificar que gcloud esté instalado
if ! command -v gcloud &> /dev/null; then
    echo -e "${RED}❌ Error: gcloud CLI no está instalado${NC}"
    echo "Instala desde: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Verificar que estás autenticado
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
    echo -e "${YELLOW}⚠️  No estás autenticado. Iniciando autenticación...${NC}"
    gcloud auth login
fi

# Obtener el proyecto actual
PROJECT_ID=$(gcloud config get-value project 2>/dev/null)

if [ -z "$PROJECT_ID" ]; then
    echo -e "${RED}❌ Error: No hay proyecto configurado${NC}"
    echo "Ejecuta: gcloud config set project TU-PROJECT-ID"
    exit 1
fi

echo -e "${GREEN}✅ Proyecto: $PROJECT_ID${NC}"

# Nombre del servicio
SERVICE_NAME="decks-imperio"
REGION="us-central1"

# Verificar si existe archivo de variables de entorno
ENV_FILE=".env.cloudrun"
if [ ! -f "$ENV_FILE" ]; then
    echo -e "${RED}❌ Error: No se encontró $ENV_FILE${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Archivo de variables encontrado${NC}"

# Convertir archivo .env a formato para --set-env-vars
ENV_VARS=$(grep -v '^#' "$ENV_FILE" | grep -v '^$' | grep '=' | tr '\n' ',' | sed 's/,$//' | sed 's/^[[:space:]]*//' | sed 's/[[:space:]]*$//')

if [ -z "$ENV_VARS" ]; then
    echo -e "${RED}❌ Error: No se encontraron variables de entorno válidas en $ENV_FILE${NC}"
    exit 1
fi

# Construir y desplegar
echo -e "${GREEN}🚀 Construyendo con Dockerfile.puppeteer...${NC}"
echo -e "${YELLOW}⚠️  Este proceso tomará más tiempo debido a la instalación de Chrome${NC}"

IMAGE_NAME="gcr.io/$PROJECT_ID/$SERVICE_NAME:latest-puppeteer"

# Extraer variables NEXT_PUBLIC_* del archivo .env
NEXT_PUBLIC_SUPABASE_URL=$(grep "^NEXT_PUBLIC_SUPABASE_URL=" "$ENV_FILE" | cut -d '=' -f2- | tr -d '"' | tr -d "'")
NEXT_PUBLIC_SUPABASE_ANON_KEY=$(grep "^NEXT_PUBLIC_SUPABASE_ANON_KEY=" "$ENV_FILE" | cut -d '=' -f2- | tr -d '"' | tr -d "'")
NEXT_PUBLIC_BUNNY_CDN_URL=$(grep "^NEXT_PUBLIC_BUNNY_CDN_URL=" "$ENV_FILE" | cut -d '=' -f2- | tr -d '"' | tr -d "'" || echo "")

# Crear un cloudbuild temporal para Puppeteer
cat > cloudbuild.puppeteer.yaml << EOF
steps:
  - name: 'gcr.io/cloud-builders/docker'
    args:
      - 'build'
      - '-t'
      - '$IMAGE_NAME'
      - '-f'
      - 'Dockerfile.puppeteer'
      - '--build-arg'
      - 'NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL'
      - '--build-arg'
      - 'NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY'
      - '--build-arg'
      - 'NEXT_PUBLIC_BUNNY_CDN_URL=$NEXT_PUBLIC_BUNNY_CDN_URL'
      - '.'
images:
  - '$IMAGE_NAME'
timeout: '1200s'
options:
  machineType: 'E2_HIGHCPU_8'
  diskSizeGb: 100
EOF

echo -e "${GREEN}📦 Construyendo imagen con Chrome y Puppeteer...${NC}"
gcloud builds submit --config cloudbuild.puppeteer.yaml --project "$PROJECT_ID"

# Limpiar archivo temporal
rm cloudbuild.puppeteer.yaml

# Desplegar desde la imagen construida con más memoria para Puppeteer
echo -e "${GREEN}🚀 Desplegando servicio con soporte Puppeteer...${NC}"
gcloud run deploy "$SERVICE_NAME" \
  --image "$IMAGE_NAME" \
  --platform managed \
  --region "$REGION" \
  --allow-unauthenticated \
  --memory 1Gi \
  --cpu 2 \
  --timeout 60s \
  --max-instances 10 \
  --set-env-vars "$ENV_VARS" \
  --project "$PROJECT_ID"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Despliegue exitoso con soporte Puppeteer!${NC}"
    echo ""
    echo -e "${GREEN}✅ La exportación de imágenes ahora funcionará correctamente en Safari/iOS${NC}"
    echo ""
    echo "Obtén la URL del servicio con:"
    echo "  gcloud run services describe $SERVICE_NAME --region $REGION --format 'value(status.url)'"
else
    echo -e "${RED}❌ Error en el despliegue${NC}"
    exit 1
fi

