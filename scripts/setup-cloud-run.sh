#!/bin/bash
# Script de configuración inicial para Google Cloud Run
# Uso: ./scripts/setup-cloud-run.sh

set -e

echo "🔧 Configurando Google Cloud para Cloud Run..."

# Colores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Verificar que gcloud esté instalado
if ! command -v gcloud &> /dev/null; then
    echo -e "${RED}❌ Error: gcloud CLI no está instalado${NC}"
    echo "Instala desde: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Verificar autenticación
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
    echo -e "${YELLOW}⚠️  Iniciando autenticación...${NC}"
    gcloud auth login
fi

# Obtener proyecto actual
PROJECT_ID=$(gcloud config get-value project 2>/dev/null)

if [ -z "$PROJECT_ID" ]; then
    echo -e "${YELLOW}⚠️  No hay proyecto configurado${NC}"
    echo "Lista de proyectos disponibles:"
    gcloud projects list
    echo ""
    read -p "Ingresa el PROJECT_ID: " PROJECT_ID
    gcloud config set project "$PROJECT_ID"
fi

echo -e "${GREEN}✅ Proyecto: $PROJECT_ID${NC}"

# Habilitar APIs necesarias
echo "🔌 Habilitando APIs necesarias..."

APIS=(
    "cloudbuild.googleapis.com"
    "run.googleapis.com"
    "containerregistry.googleapis.com"
)

for API in "${APIS[@]}"; do
    echo -n "  Habilitando $API... "
    if gcloud services enable "$API" --project="$PROJECT_ID" 2>/dev/null; then
        echo -e "${GREEN}✅${NC}"
    else
        echo -e "${YELLOW}⚠️  (puede que ya esté habilitada)${NC}"
    fi
done

echo ""
echo -e "${GREEN}✅ Configuración completada!${NC}"
echo ""
echo "Próximos pasos:"
echo "1. Crea el archivo .env.cloudrun con tus variables de entorno"
echo "2. Ejecuta: ./scripts/deploy-cloud-run.sh"
echo ""
echo "O manualmente:"
echo "  gcloud run deploy decks-imperio --source . --region us-central1 --allow-unauthenticated"

