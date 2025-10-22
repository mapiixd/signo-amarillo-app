# 🃏 Decks Imperio

Una aplicación web completa para gestionar barajas de **Mitos y Leyendas** en formato **Imperio**. Construida con Next.js 15, TypeScript, Tailwind CSS y Supabase.

## ✨ Características

- 📚 **Colección de Cartas**: Explora todas las cartas disponibles con imágenes reales
- 🛠️ **Constructor de Barajas**: Crea y personaliza tus propias decks
- 📊 **Gestión de Decks**: Organiza y administra tus barajas guardadas
- ⚙️ **Panel de Administración**: CRUD completo para gestionar cartas
- 🖼️ **Imágenes Reales**: Más de 2000 imágenes de cartas integradas
- 🔄 **Base de Datos Escalables**: Supabase con PostgreSQL

## 🚀 Inicio Rápido

### 1. Configurar Supabase

Sigue las instrucciones en [`SUPABASE_SETUP.md`](./SUPABASE_SETUP.md) para crear tu proyecto en Supabase.

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar variables de entorno

Crea un archivo `.env.local` con tus credenciales de Supabase:

```env
DATABASE_URL="postgresql://postgres:[TU-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"
NEXT_PUBLIC_SUPABASE_URL="https://[PROJECT-REF].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="[TU-ANON-KEY]"
```

### 4. Configurar la base de datos

**Opción A: Setup automático (recomendado)**
```bash
npm run setup
```

**Opción B: Setup manual**
```bash
# Generar cliente Prisma
npx prisma generate

# Crear tablas en Supabase
npx prisma db push

# Poblar con cartas iniciales
npm run seed-cards

# Asignar imágenes a las cartas
npm run update-images
```

### 5. Iniciar servidor de desarrollo

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

## 📁 Estructura del Proyecto

```
decks-imperio/
├── prisma/
│   ├── schema.prisma          # Esquema de base de datos
│   └── seed.ts               # Datos iniciales
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
npm run db:push         # Sincronizar esquema con Supabase
npm run db:studio       # Abrir Prisma Studio
npm run seed-cards      # Poblar con cartas de ejemplo
npm run update-images   # Asignar imágenes a cartas

# Utilidades
npm run lint            # Ejecutar ESLint
```

## 🗄️ Modelo de Datos

### Carta (Card)
- **Tipos**: Talismán, Arma, Tótem, Aliado, Oro
- **Campos**: Nombre, tipo, coste, fuerza/defensa, rareza, expansión
- **Imágenes**: Integradas automáticamente desde `/public/cards/`

### Baraja (Deck)
- **Relación**: Many-to-many con cartas a través de DeckCard
- **Campos**: Nombre, descripción, fecha de creación

## 🎯 Formato Imperio

- **Barajas**: Mínimo 60 cartas
- **Sin límites**: Cualquier cantidad de copias por carta
- **Todas las expansiones**: Permitidas
- **Énfasis**: Estrategia y sinergia

## 🔧 Tecnologías

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Prisma ORM
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
