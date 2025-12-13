#!/bin/bash
# Script para desplegar en Google Cloud Run
# Uso: ./scripts/deploy-cloud-run.sh

set -e

echo "🚀 Iniciando despliegue en Google Cloud Run..."

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
    echo -e "${YELLOW}⚠️  No se encontró $ENV_FILE${NC}"
    echo "Creando archivo de ejemplo..."
    cat > "$ENV_FILE" << EOF
# Variables de entorno para Cloud Run
# NO subas este archivo a Git (debe estar en .gitignore)

# Variables Requeridas
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key-aqui
JWT_SECRET=tu-jwt-secret-aqui

# CDN (Opcional pero recomendado si usas Bunny.net)
# NEXT_PUBLIC_BUNNY_CDN_URL=https://tu-pull-zone.b-cdn.net

# Nota: BUNNY_STORAGE_ZONE y BUNNY_STORAGE_API_KEY solo se usan en scripts locales,
# NO son necesarias en Cloud Run
EOF
    echo -e "${YELLOW}⚠️  Por favor, edita $ENV_FILE con tus valores reales${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Archivo de variables encontrado${NC}"

# Convertir archivo .env a formato para --set-env-vars
# Filtrar comentarios y líneas vacías, luego convertir a formato KEY=VALUE,KEY2=VALUE2
ENV_VARS=$(grep -v '^#' "$ENV_FILE" | grep -v '^$' | grep '=' | tr '\n' ',' | sed 's/,$//' | sed 's/^[[:space:]]*//' | sed 's/[[:space:]]*$//')

if [ -z "$ENV_VARS" ]; then
    echo -e "${RED}❌ Error: No se encontraron variables de entorno válidas en $ENV_FILE${NC}"
    echo "Asegúrate de que el archivo tenga variables en formato KEY=VALUE"
    exit 1
fi

# Construir y desplegar
echo -e "${GREEN}🚀 Construyendo y desplegando servicio: $SERVICE_NAME${NC}"
echo "Esto puede tomar 5-10 minutos..."

# Opción 1: Usar cloudbuild.yaml si existe
if [ -f "cloudbuild.yaml" ]; then
    echo -e "${GREEN}📦 Usando cloudbuild.yaml para construir la imagen...${NC}"
    IMAGE_NAME="gcr.io/$PROJECT_ID/$SERVICE_NAME:latest"
    
    # Extraer variables NEXT_PUBLIC_* del archivo .env para pasarlas como substitutions
    NEXT_PUBLIC_SUPABASE_URL=$(grep "^NEXT_PUBLIC_SUPABASE_URL=" "$ENV_FILE" | cut -d '=' -f2- | tr -d '"' | tr -d "'")
    NEXT_PUBLIC_SUPABASE_ANON_KEY=$(grep "^NEXT_PUBLIC_SUPABASE_ANON_KEY=" "$ENV_FILE" | cut -d '=' -f2- | tr -d '"' | tr -d "'")
    NEXT_PUBLIC_BUNNY_CDN_URL=$(grep "^NEXT_PUBLIC_BUNNY_CDN_URL=" "$ENV_FILE" | cut -d '=' -f2- | tr -d '"' | tr -d "'" || echo "")
    
    # Construir la imagen usando cloudbuild.yaml con substitutions
    BUILD_SUBS=""
    if [ -n "$NEXT_PUBLIC_SUPABASE_URL" ]; then
        BUILD_SUBS="${BUILD_SUBS}_NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL},"
    fi
    if [ -n "$NEXT_PUBLIC_SUPABASE_ANON_KEY" ]; then
        BUILD_SUBS="${BUILD_SUBS}_NEXT_PUBLIC_SUPABASE_ANON_KEY=${NEXT_PUBLIC_SUPABASE_ANON_KEY},"
    fi
    if [ -n "$NEXT_PUBLIC_BUNNY_CDN_URL" ]; then
        BUILD_SUBS="${BUILD_SUBS}_NEXT_PUBLIC_BUNNY_CDN_URL=${NEXT_PUBLIC_BUNNY_CDN_URL},"
    fi
    BUILD_SUBS=$(echo "$BUILD_SUBS" | sed 's/,$//')
    
    if [ -n "$BUILD_SUBS" ]; then
        echo -e "${GREEN}📦 Construyendo con variables de entorno...${NC}"
        gcloud builds submit --config cloudbuild.yaml --substitutions "$BUILD_SUBS" --project "$PROJECT_ID"
    else
        echo -e "${YELLOW}⚠️  No se encontraron variables NEXT_PUBLIC_* en $ENV_FILE${NC}"
        echo -e "${YELLOW}⚠️  Construyendo sin variables de build (puede fallar si son requeridas)...${NC}"
        gcloud builds submit --config cloudbuild.yaml --project "$PROJECT_ID"
    fi
    
    # Desplegar desde la imagen construida
    gcloud run deploy "$SERVICE_NAME" \
      --image "$IMAGE_NAME" \
      --platform managed \
      --region "$REGION" \
      --allow-unauthenticated \
      --memory 512Mi \
      --cpu 1 \
      --max-instances 10 \
      --set-env-vars "$ENV_VARS" \
      --project "$PROJECT_ID"
else
    # Opción 2: Construir imagen directamente y luego desplegar
    echo -e "${GREEN}📦 Construyendo imagen Docker...${NC}"
    IMAGE_NAME="gcr.io/$PROJECT_ID/$SERVICE_NAME:latest"
    
    # Extraer variables NEXT_PUBLIC_* del archivo .env para pasarlas como build args
    NEXT_PUBLIC_SUPABASE_URL=$(grep "^NEXT_PUBLIC_SUPABASE_URL=" "$ENV_FILE" | cut -d '=' -f2- | tr -d '"' | tr -d "'")
    NEXT_PUBLIC_SUPABASE_ANON_KEY=$(grep "^NEXT_PUBLIC_SUPABASE_ANON_KEY=" "$ENV_FILE" | cut -d '=' -f2- | tr -d '"' | tr -d "'")
    NEXT_PUBLIC_BUNNY_CDN_URL=$(grep "^NEXT_PUBLIC_BUNNY_CDN_URL=" "$ENV_FILE" | cut -d '=' -f2- | tr -d '"' | tr -d "'" || echo "")
    
    # Construir la imagen usando gcloud builds submit
    # Nota: gcloud builds submit no soporta build args directamente,
    # por lo que recomendamos usar cloudbuild.yaml para builds con variables
    echo -e "${YELLOW}⚠️  Construyendo sin cloudbuild.yaml...${NC}"
    echo -e "${YELLOW}⚠️  Para pasar variables durante el build, usa cloudbuild.yaml${NC}"
    echo -e "${YELLOW}⚠️  Las variables de entorno se configurarán en tiempo de ejecución${NC}"
    gcloud builds submit --tag "$IMAGE_NAME" --project "$PROJECT_ID"
    
    # Desplegar desde la imagen construida
    echo -e "${GREEN}🚀 Desplegando servicio...${NC}"
    gcloud run deploy "$SERVICE_NAME" \
      --image "$IMAGE_NAME" \
      --platform managed \
      --region "$REGION" \
      --allow-unauthenticated \
      --memory 512Mi \
      --cpu 1 \
      --max-instances 10 \
      --set-env-vars "$ENV_VARS" \
      --project "$PROJECT_ID"
fi

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Despliegue exitoso!${NC}"
    echo ""
    echo "Obtén la URL del servicio con:"
    echo "  gcloud run services describe $SERVICE_NAME --region $REGION --format 'value(status.url)'"
else
    echo -e "${RED}❌ Error en el despliegue${NC}"
    exit 1
fi

