# 📁 Carpeta de Datos

Esta carpeta contiene los archivos Excel con los datos de las cartas de las diferentes ediciones.

## 📋 Formato del Excel

Cada archivo Excel debe tener las siguientes columnas (los nombres pueden variar en mayúsculas/minúsculas):

### Columnas Requeridas:
- **name** (o Name, NOMBRE, nombre): Nombre de la carta
- **type** (o Type, TIPO, tipo): Tipo de carta (TALISMAN, ARMA, TOTEM, ALIADO, ORO)
- **rarity** (o Rarity, RAREZA, rareza): Rareza (VASALLO, CORTESANO, REAL, MEGA_REAL, ULTRA_REAL, LEGENDARIA, PROMO, SECRETA)
- **expansion** (o Expansion, EXPANSION, expansion): Nombre de la expansión/edición

### Columnas Opcionales:
- **cost** (o Cost, COSTE, coste): Coste de la carta (número)
- **attack** (o Attack, ATAQUE, ataque): Ataque (número)
- **defense** (o Defense, DEFENSA, defensa): Defensa (número)
- **description** (o Description, DESCRIPCION, descripcion): Descripción de la carta
- **race** (o Race, RAZA, raza): Raza del aliado (Bestia, Caballero, Dragón, etc.)
- **image_file** (o ImageFile, IMAGE_FILE, imageFile): Nombre del archivo de imagen
- **image_url** (o ImageUrl, IMAGE_URL, imageUrl): URL de la imagen

## 🚀 Uso

### Importar una nueva edición (sin eliminar datos existentes):
```bash
npm run import-excel
```

Este comando:
- Lee todos los archivos `.xlsx` y `.xls` de esta carpeta
- Crea nuevas cartas si no existen (basado en nombre + expansión)
- Actualiza cartas existentes si ya están en la base de datos

### Resetear e importar todo desde cero:
```bash
npm run reset-import-all
```

⚠️ **ADVERTENCIA**: Este comando elimina TODAS las cartas existentes antes de importar.

## 📝 Ejemplo de Estructura del Excel

| name | type | cost | attack | defense | rarity | expansion | race | description |
|------|------|------|--------|---------|--------|-----------|------|-------------|
| Espada de Fuego | ARMA | 2 | 3 | 0 | REAL | Nueva Edición | - | Una espada poderosa |
| Guerrero Bestia | ALIADO | 3 | 2 | 2 | CORTESANO | Nueva Edición | Bestia | Un guerrero feroz |

## 💡 Notas

- Los archivos pueden tener cualquier nombre, pero deben tener extensión `.xlsx` o `.xls`
- El script procesa la primera hoja de cada archivo Excel
- Si una carta con el mismo nombre y expansión ya existe, se actualizará en lugar de crear una duplicada






