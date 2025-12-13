# 🎄 Lista de Deseos Navideños (Christmas Wishlist)

Este proyecto es una aplicación web para compartir listas de regalos de Navidad entre amigos y familiares. Permite subir fotos de los regalos, genera títulos y descripciones automáticas usando Inteligencia Artificial (Google Gemini), y permite a los usuarios interactuar (dar like/dislike y comentar).

## 🛠 Tecnologías Utilizadas

### Frontend
- **React**: Biblioteca principal de UI.
- **Vite**: Empaquetador y servidor de desarrollo rápido.
- **Tailwind CSS**: Framework de estilos para un diseño moderno y responsivo.
- **Axios / Fetch**: Para comunicación con el backend.

### Backend
- **Node.js & Express**: Servidor API RESTful.
- **MongoDB**: Base de datos NoSQL para guardar usuarios, regalos y comentarios.
- **Mongoose**: ODM para modelar los datos de MongoDB.
- **Google Gemini AI**: API de inteligencia artificial para analizar imágenes y generar descripciones divertidas.

### Infraestructura y Despliegue
- **Docker & Docker Compose**: Para contenerizar la aplicación (Frontend, Backend, Nginx).
- **Nginx**: Servidor web y proxy reverso para servir el frontend y redirigir peticiones al backend.
- **VPS (Ubuntu)**: Servidor de producción donde corre la aplicación.

## 🚀 Cómo Correr el Proyecto (Local)

1. **Requisitos Previos**:
   - Node.js (v18+)
   - Docker y Docker Compose (opcional, pero recomendado)

2. **Backend**:
   ```bash
   cd backend
   npm install
   # Crear archivo .env con: PORT=5000, MONGODB_URI=..., GEMINI_API_KEY=...
   npm run dev
   ```

3. **Frontend**:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

## 🐳 Despliegue con Docker

El proyecto está configurado para desplegarse fácilmente con Docker Compose.

1. **Configurar Variables de Entorno**:
   Asegúrate de tener los archivos `.env` en `backend/` y `frontend/` (si aplica).

2. **Levantar Servicios**:
   ```bash
   docker-compose up -d --build
   ```
   Esto levantará:
   - Frontend en puerto 80 (mapeado desde Nginx).
   - Backend en puerto 5000.

## 📝 Notas de Mantenimiento (Para el "Yo" del futuro)

- **Estructura**: `frontend/` contiene toda la UI. `backend/` la lógica y base de datos.
- **Gemini AI**: La lógica de IA está en `backend/src/services/ai.ts`. Si la API cambia o la clave expira, revisa ese archivo y el `.env`.
- **Base de Datos**: Si cambias el modelo de datos (`backend/src/models/`), recuerda actualizar las interfaces en el frontend (`frontend/src/types.ts`).
- **Despliegue**: Actualmente se despliega copiando archivos al VPS y reconstruyendo Docker. En un futuro, considera usar CI/CD (ver `GUIA_PROFESIONAL.md`).
