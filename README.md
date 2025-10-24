# ⭐ El Signo Amarillo

**Constructor de Mazos para formato Imperio**

Una aplicación web completa para gestionar barajas de **Mitos y Leyendas** en formato **Imperio**. Inspirada en el universo de Carcosa y el Rey de Amarillo. Construida con Next.js 15, TypeScript, Tailwind CSS y Supabase.

> 🎉 **Nueva Migración JSONB:** Aplicación optimizada - 16x más rápida, 98.5% menos filas en BD. Ver [`EMPIEZA_AQUI.md`](./EMPIEZA_AQUI.md) para migrar.

## ✨ Características

- 📚 **Colección de Cartas**: Explora todas las cartas disponibles con imágenes reales
- 🛠️ **Constructor de Barajas**: Crea y personaliza tus propias decks
- 📊 **Gestión de Decks**: Organiza y administra tus barajas guardadas
- 🔐 **Sistema de Autenticación**: Registro, login y roles (Usuario/Admin)
- 👥 **Gestión de Usuarios**: Cada usuario puede crear sus propios mazos
- ⚙️ **Panel de Administración**: CRUD completo para gestionar cartas (solo admin)
- 🖼️ **Imágenes Reales**: Más de 2000 imágenes de cartas integradas
- 🔄 **Base de Datos Escalables**: Supabase con PostgreSQL

## 🚀 Inicio Rápido

### 1. Configurar Supabase

Sigue las instrucciones en [`SUPABASE_SETUP.md`](./SUPABASE_SETUP.md) para crear tu proyecto en Supabase.

### 1.5. (Opcional) Configurar CDN para Imágenes

Para servir las imágenes desde un CDN rápido y económico:
- **Bunny.net**: Ver [`BUNNY_CDN_SETUP.md`](./BUNNY_CDN_SETUP.md) - Recomendado (~$2/mes para 2.7GB)

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar variables de entorno

Crea un archivo `.env.local` con tus credenciales de Supabase y autenticación:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL="https://[PROJECT-REF].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="[TU-ANON-KEY]"

# Autenticación (JWT)
JWT_SECRET="tu-clave-secreta-super-larga-y-segura-aqui"
```

### 4. Configurar la base de datos

**Opción A: Setup automático (recomendado)**
```bash
npm run setup
```

**Opción B: Setup manual**
```bash
# Poblar con cartas iniciales
npm run seed-cards

# Asignar imágenes a las cartas
npm run update-images
```

### 5. Crear usuario administrador

```bash
npm run create-admin
```

Ingresa nombre de usuario, correo y contraseña para crear tu primer administrador.

### 6. Iniciar servidor de desarrollo

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

## 🔐 Sistema de Autenticación

La aplicación incluye un sistema completo de autenticación:

- **Registro** (`/register`) - Crea una cuenta nueva
- **Login** (`/login`) - Inicia sesión
- **Roles**: Usuario (por defecto) y Administrador
- **Protección de rutas** - Middleware automático
- **Sesiones JWT** - Cookies seguras con expiración de 7 días

**Ver documentación completa**: [`AUTH_SETUP.md`](./AUTH_SETUP.md)  
**Guía rápida**: [`AUTH_QUICKSTART.md`](./AUTH_QUICKSTART.md)

## 📁 Estructura del Proyecto

```
decks-imperio/
├── public/
│   └── cards/                # Imágenes de cartas organizadas por expansión
├── src/
│   ├── app/                  # Páginas Next.js (App Router)
│   │   ├── admin/           # Panel de administración
│   │   ├── api/             # API Routes
│   │   ├── cards/           # Página de colección
│   │   ├── decks/           # Gestión de barajas
│   │   └── page.tsx         # Página principal
│   ├── components/          # Componentes reutilizables
│   ├── lib/                 # Utilidades y configuración
│   └── types/               # Definiciones TypeScript
└── SUPABASE_SETUP.md        # Guía de configuración de Supabase
```

## 🛠️ Comandos Disponibles

```bash
# Desarrollo
npm run dev              # Servidor de desarrollo
npm run build           # Construir para producción
npm run start           # Servidor de producción

# Base de datos
npm run seed-cards      # Poblar con cartas de ejemplo
npm run update-images   # Asignar imágenes a cartas

# Autenticación
npm run create-admin    # Crear usuario administrador

# CDN (opcional)
npm run upload-to-bunny # Subir imágenes a Bunny.net CDN

# Utilidades
npm run lint            # Ejecutar ESLint
```

## 🗄️ Modelo de Datos

### Carta (Card)
- **Tipos**: Talismán, Arma, Tótem, Aliado, Oro
- **Campos**: Nombre, tipo, coste, fuerza/defensa, rareza, expansión
- **Imágenes**: Integradas automáticamente desde `/public/cards/`

### Baraja (Deck)
- **Estructura**: JSONB optimizada (ver [`DECK_STRUCTURE_JSONB.md`](./DECK_STRUCTURE_JSONB.md))
- **Campos**: Nombre, descripción, raza, formato, cartas (JSONB), sideboard (JSONB)
- **Ventajas**: 98% menos filas en BD, queries más rápidas, mejor escalabilidad

## 🎯 Formato Imperio Racial

### Mazo Principal (50 cartas exactas)
- **Máximo 3 copias** por carta (excepto Oro: hasta 10)
- **Solo aliados** de la raza seleccionada
- **Máximo 4 aliados** sin raza

### Mazo de Refuerzo (15 cartas exactas)
- **Sideboard**: Cartas intercambiables entre partidas
- **Máximo 3 copias** por carta (excepto Oro: hasta 10)
- **Puede incluir** aliados de otras razas

### Sistema de Banlist
- ❌ **Prohibidas**: No permitidas en ningún formato
- ⚠️ **Limitadas**: Máximo 1-2 copias según carta
- Ver [`BANLIST_SYSTEM.md`](./BANLIST_SYSTEM.md) para lista completa

## 🔧 Tecnologías

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Supabase
- **Base de datos**: Supabase (PostgreSQL)
- **Despliegue**: Vercel (recomendado)

## 🚀 Despliegue en Vercel

1. Conecta tu repositorio a [Vercel](https://vercel.com)
2. Configura las variables de entorno en Vercel
3. Despliega automáticamente

## 📝 Próximos Pasos

- [ ] Sistema de autenticación de usuarios
- [ ] Guardado de decks por usuario
- [ ] Comunidad para compartir decks
- [ ] Estadísticas y análisis de decks
- [ ] API pública para integraciones

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT.

## 🙏 Agradecimientos

- Comunidad de Mitos y Leyendas
- Equipo de Supabase
- Comunidad de Next.js
