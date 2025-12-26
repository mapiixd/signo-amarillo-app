# 🗄️ Scripts de Base de Datos

Este directorio contiene scripts SQL para crear las tablas necesarias en Supabase.

## 📋 Tablas Requeridas

### password_reset_tokens

Tabla para almacenar tokens temporales de recuperación de contraseña.

**Para crear la tabla:**

1. Ve a tu proyecto en [Supabase Dashboard](https://app.supabase.com)
2. Navega a **SQL Editor**
3. Copia y pega el contenido de `password_reset_tokens.sql`
4. Ejecuta el script

O desde la línea de comandos usando `psql`:

```bash
psql -h [TU-HOST] -U postgres -d postgres -f password_reset_tokens.sql
```

## 🔐 Estructura de la Tabla

```sql
password_reset_tokens
├── id (UUID, PRIMARY KEY)
├── userId (TEXT, FOREIGN KEY → users.id)
├── token (TEXT, UNIQUE)
├── expiresAt (TIMESTAMPTZ)
└── createdAt (TIMESTAMPTZ)
```

## 🔄 Limpieza Automática

Los tokens expirados se eliminan automáticamente cuando:
- Se usa un token para resetear la contraseña
- Se solicita un nuevo token de recuperación (se eliminan los anteriores del usuario)

Opcionalmente, puedes crear un cron job o función en Supabase para limpiar tokens expirados periódicamente:

```sql
-- Función para limpiar tokens expirados (ejecutar periódicamente)
DELETE FROM password_reset_tokens 
WHERE expiresAt < NOW();
```

