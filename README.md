# ⭐ El Signo Amarillo

**La plataforma para forjar y compartir tus mazos de Mitos y Leyendas Imperio**

Una aplicación web completa diseñada para la comunidad de jugadores de **Mitos y Leyendas** en formato **Imperio**. Inspirada en el universo místico de Carcosa y el Rey de Amarillo, esta plataforma te permite explorar cartas, construir mazos, gestionar tu colección y compartir tus creaciones con la comunidad.

> 🎉 **Optimización JSONB:** Aplicación optimizada - 16x más rápida, 98.5% menos filas en BD. Ver [`EMPIEZA_AQUI.md`](./EMPIEZA_AQUI.md) para migrar.

## 🎯 ¿Qué hace este sitio?

**El Signo Amarillo** es una plataforma completa para jugadores de Mitos y Leyendas que incluye:

### 📚 Grimorio de Cartas (`/cards`)
- **Exploración completa**: Navega por todas las cartas disponibles en formato Imperio
- **Búsqueda avanzada**: Filtra por tipo, expansión, raza, coste y más
- **Imágenes reales**: Más de 2000 imágenes de cartas de alta calidad
- **Detalles completos**: Visualiza toda la información de cada carta (estadísticas, habilidades, rareza, etc.)
- **Información de banlist**: Consulta el estado de cada carta (permitida, limitada o prohibida)

### 🛠️ Forja de Mazos (`/decks/new`)
- **Constructor visual**: Crea tus mazos arrastrando y soltando cartas
- **Validación automática**: El sistema verifica que tu mazo cumpla con las reglas del formato Imperio:
  - Mazo principal: exactamente 50 cartas
  - Mazo de refuerzo: exactamente 15 cartas
  - Límites de copias por carta (máximo 3, excepto Oro: hasta 10)
  - Restricciones raciales para aliados
- **Gestión de sideboard**: Organiza tu mazo de refuerzo fácilmente
- **Vista previa**: Visualiza tu mazo antes de guardarlo
- **Exportar**: Genera imágenes o listas de tu mazo

### 📊 Mis Mazos (`/decks`)
- **Gestión personal**: Organiza todos tus mazos guardados
- **Edición**: Modifica tus mazos existentes
- **Eliminación**: Borra mazos que ya no necesites
- **Búsqueda**: Encuentra rápidamente tus mazos por nombre o raza

### 👥 Mazos de la Comunidad (`/decks/community`)
- **Compartir**: Publica tus mazos para que otros los vean
- **Explorar**: Descubre mazos creados por otros jugadores
- **Inspiración**: Encuentra nuevas estrategias y combinaciones

### 📋 Banlist (`/banlist`)
- **Consulta completa**: Revisa todas las cartas prohibidas y limitadas
- **Información detallada**: Entiende por qué cada carta está restringida
- **Filtros**: Busca por nombre, tipo o estado de restricción
- **Actualizaciones**: Mantente al día con los cambios en las reglas

### ⚙️ Panel de Administración (`/admin/cards`) - Solo Admin
- **Gestión de cartas**: CRUD completo para administrar la base de datos de cartas
- **Importación masiva**: Carga cartas desde archivos Excel
- **Actualización de imágenes**: Asigna y actualiza imágenes de cartas
- **Gestión de expansiones**: Administra las expansiones disponibles

## ✨ Características Principales

- 🎨 **Diseño temático**: Interfaz inspirada en Carcosa con colores místicos (amarillo del Rey, cyan místico)
- 🔐 **Autenticación completa**: Sistema de registro, login y gestión de usuarios
- 👤 **Perfiles de usuario**: Cada usuario puede crear y gestionar sus propios mazos
- 🛡️ **Roles y permisos**: Sistema de administradores con acceso a funciones especiales
- 🖼️ **CDN integrado**: Soporte para servir imágenes desde Bunny.net CDN (opcional)
- ⚡ **Rendimiento optimizado**: Base de datos JSONB para consultas ultra-rápidas
- 📱 **Responsive**: Diseño adaptativo que funciona en móviles, tablets y desktop
- 🌙 **Tema oscuro**: Interfaz oscura que reduce la fatiga visual

## 🔐 Sistema de Autenticación

La aplicación incluye un sistema completo de autenticación:

- **Registro** (`/register`) - Crea una cuenta nueva
- **Login** (`/login`) - Inicia sesión con tu cuenta
- **Roles**: Usuario (por defecto) y Administrador
- **Protección de rutas** - Middleware automático que protege rutas privadas
- **Sesiones JWT** - Cookies seguras con expiración de 7 días
- **Gestión de perfil** - Los usuarios pueden ver y gestionar su información

## 🗄️ Modelo de Datos

### Carta (Card)
- **Tipos**: Talismán, Arma, Tótem, Aliado, Oro
- **Campos**: Nombre, tipo, coste, fuerza/defensa, rareza, expansión, raza, imagen
- **Imágenes**: Integradas automáticamente desde `/public/cards/` o CDN
- **Banlist**: Estado de restricción (permitida, limitada, prohibida)

### Baraja (Deck)
- **Estructura**: JSONB optimizada (ver [`DECK_STRUCTURE_JSONB.md`](./DECK_STRUCTURE_JSONB.md))
- **Campos**: Nombre, descripción, raza, formato, cartas (JSONB), sideboard (JSONB), usuario_id, público
- **Ventajas**: 98% menos filas en BD, queries más rápidas, mejor escalabilidad
- **Privacidad**: Los usuarios pueden hacer sus mazos públicos o privados

### Usuario (User)
- **Campos**: id, username, email, password_hash, role
- **Roles**: USER (por defecto), ADMIN (acceso a panel de administración)

## 🎯 Formato Imperio Racial

### Mazo Principal (50 cartas exactas)
- **Máximo 3 copias** por carta (excepto Oro: hasta 10)
- **Solo aliados** de la raza seleccionada
- **Máximo 4 aliados** sin raza
- **Validación automática** en el constructor

### Mazo de Refuerzo (15 cartas exactas)
- **Sideboard**: Cartas intercambiables entre partidas
- **Máximo 3 copias** por carta (excepto Oro: hasta 10)
- **Puede incluir** aliados de otras razas
- **Flexibilidad estratégica** para adaptarse a diferentes oponentes

### Sistema de Banlist
- ❌ **Prohibidas**: No permitidas en ningún formato
- ⚠️ **Limitadas**: Máximo 1-2 copias según carta
- ✅ **Permitidas**: Sin restricciones
- Ver [`BANLIST_SYSTEM.md`](./BANLIST_SYSTEM.md) para lista completa

## 🎨 Diseño y Temática

El sitio está inspirado en el universo de **Carcosa** y el **Rey de Amarillo**:

- **Colores principales**:
  - Amarillo del Rey (#F4C430) - Títulos y acentos principales
  - Cyan Místico (#2D9B96) - Enlaces y elementos secundarios
  - Fondo oscuro (#0A0E1A) - Base oscura para reducir fatiga visual
  
- **Tipografía**:
  - **Cinzel** - Fuente principal (serif elegante)
  - **Cormorant Garamond** - Fuente secundaria disponible

- **Efectos visuales**:
  - Glow effects (resplandores) en elementos interactivos
  - Sombras con colores temáticos
  - Transiciones suaves en hover

## 🔧 Tecnologías

- **Frontend**: 
  - Next.js 15 (App Router)
  - React 19
  - TypeScript
  - Tailwind CSS v4
  - SweetAlert2 (alertas elegantes)

- **Backend**: 
  - Next.js API Routes
  - JWT para autenticación
  - bcryptjs para hash de contraseñas

- **Base de datos**: 
  - Supabase (PostgreSQL)
  - JSONB para optimización de queries

- **Despliegue**: 
  - Vercel (recomendado para Next.js)
  - Google Cloud Run (alternativa con Docker)

## 📝 Características Futuras

- [ ] Sistema de favoritos para cartas y mazos
- [ ] Estadísticas y análisis de mazos
- [ ] Sistema de comentarios en mazos de la comunidad
- [ ] Exportación de mazos en diferentes formatos
- [ ] API pública para integraciones
- [ ] Sistema de notificaciones
- [ ] Historial de cambios en mazos
- [ ] Comparador de mazos

## 🤝 Contribuir

Las contribuciones son bienvenidas. Para contribuir:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## ⚠️ Disclaimer

Este es un proyecto **no oficial** y **sin fines de lucro**, creado por fans para fans de Mitos y Leyendas. 

- **Mitos y Leyendas** y sus respectivas artes de cartas son propiedad de sus creadores.
- Este proyecto está hecho para ayudar a la comunidad de jugadores del formato Imperio.
- No está afiliado ni respaldado oficialmente por los creadores de Mitos y Leyendas.

## 📄 Licencia

Este proyecto está bajo la Licencia MIT.

## 🙏 Agradecimientos

- Comunidad de jugadores de Mitos y Leyendas
- Equipo de Supabase por su excelente plataforma
- Comunidad de Next.js por las herramientas increíbles
- Todos los contribuidores y usuarios de la plataforma

---

**⭐ Construye tu imperio, carta por carta. En Carcosa, donde las leyendas cobran vida.**
