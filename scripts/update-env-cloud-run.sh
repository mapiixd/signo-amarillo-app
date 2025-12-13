#!/bin/bash
# Script para actualizar variables de entorno en Cloud Run
# Uso: ./scripts/update-env-cloud-run.sh

set -e

SERVICE_NAME="decks-imperio"
REGION="us-central1"
ENV_FILE=".env.cloudrun"

# Colores
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

if [ ! -f "$ENV_FILE" ]; then
    echo -e "${RED}❌ Error: No se encontró $ENV_FILE${NC}"
    exit 1
fi

# Convertir archivo .env a formato para --set-env-vars
ENV_VARS=$(grep -v '^#' "$ENV_FILE" | grep -v '^$' | grep '=' | tr '\n' ',' | sed 's/,$//' | sed 's/^[[:space:]]*//' | sed 's/[[:space:]]*$//')

if [ -z "$ENV_VARS" ]; then
    echo -e "${RED}❌ Error: No se encontraron variables de entorno válidas en $ENV_FILE${NC}"
    exit 1
fi

echo "🔄 Actualizando variables de entorno para $SERVICE_NAME..."

gcloud run services update "$SERVICE_NAME" \
  --region "$REGION" \
  --set-env-vars "$ENV_VARS"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Variables de entorno actualizadas${NC}"
else
    echo -e "${RED}❌ Error al actualizar variables${NC}"
    exit 1
fi

