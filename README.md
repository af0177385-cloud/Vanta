# Vanta 🛍️

Tienda de ropa sencilla donde se pueden **ver, buscar, agregar, editar y eliminar productos**. Los datos se guardan en una base de datos real (Supabase) y las imágenes en un bucket de almacenamiento.

Es un proyecto que hice para practicar el flujo completo: frontend → servidor → base de datos.

## Tecnologías

- **Frontend:** HTML, CSS y JavaScript puro
- **Backend:** Node.js con el módulo `http` (sin Express)
- **Base de datos e imágenes:** Supabase (PostgreSQL + Storage)
- **Librerías:** `@supabase/supabase-js`, `busboy` (subir imágenes), `dotenv` (variables de entorno)

## Estructura del proyecto

```
Vanta/
├── backend/
│   ├── servidor.js
│   ├── package.json
│   └── .env            (no se sube a GitHub)
└── frontend/
    ├── index.html
    ├── script.js
    └── styles.css
```

## Qué puede hacer

- Mostrar todos los productos en tarjetas
- Buscar productos por nombre mientras escribes
- Agregar un producto con imagen, nombre, descripción y precio
- Editar nombre, descripción y precio
- Eliminar un producto (también borra su imagen del bucket)

## Cómo correrlo

### 1. Requisitos

- Node.js 22 o superior
- Una cuenta en [Supabase](https://supabase.com)
- VS Code con la extensión Live Server

### 2. Preparar Supabase

Crea una tabla llamada `productos` con estas columnas:

| Columna      | Tipo          |
|--------------|---------------|
| id           | int (autoincremental) |
| nombre       | text          |
| descripcion  | text          |
| precio       | numeric(10,2) |
| imagen_url   | text          |

Luego crea un bucket público en Storage llamado `productos`.

### 3. Backend

```bash
cd backend
npm install
```

Crea un archivo `.env` dentro de `backend/`:

```
SUPABASE_URL=tu_url_de_supabase
CLAVE_SUPABASE=tu_clave_de_supabase
```

Inicia el servidor:

```bash
node servidor.js
```

Queda corriendo en `http://localhost:4000`.

### 4. Frontend

Abre `frontend/index.html` con **Live Server** (clic derecho → *Open with Live Server*). El servidor solo acepta peticiones desde `http://127.0.0.1:5500`, que es la dirección por defecto de Live Server.

## Rutas del servidor

| Método | Ruta                  | Qué hace                                             |
|--------|-----------------------|------------------------------------------------------|
| GET    | `/productos`          | Trae todos los productos                             |
| GET    | `/producto/:id`       | Trae un producto por su id                           |
| POST   | `/producto`           | Agrega productos (recibe un array de objetos)        |
| PUT    | `/producto/:id`       | Actualiza todos los campos de un producto            |
| PATCH  | `/producto/:id`       | Actualiza solo los campos que se envíen              |
| DELETE | `/producto/:id`       | Elimina un producto y su imagen                      |
| DELETE | `/eliminar/productos` | Elimina varios productos. Body: `{ "ids": [1, 2] }`  |
| POST   | `/imagen_url`         | Sube una imagen (form-data) y devuelve su URL        |

Todas las respuestas tienen esta forma: `{ "mensaje": ... }`.

El servidor valida los datos (tipos, campos vacíos, precios negativos, ids incorrectos) y responde con el código de error correcto (400, 404 o 500).

## Cosas por mejorar

- No hay login ni permisos: cualquiera que abra la página puede eliminar o editar productos.
- Si subes dos imágenes con el mismo nombre de archivo, la segunda falla.
- La dirección del servidor y el origen permitido están escritos directamente en el código.
- El diseño es básico, la prioridad fue que la lógica funcionara.

## Lo que aprendí

- Crear un servidor HTTP en Node sin frameworks
- Hacer un CRUD completo con validaciones y manejo de errores
- Conectar un servidor con Supabase (base de datos y Storage)
- Subir archivos con `FormData` y `busboy`
- Conectar un frontend con un backend usando `fetch` y resolver problemas de CORS
