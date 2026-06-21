# TIDAL OBS Widget (Last.fm Integration)

Este widget está diseñado para mostrar en tiempo real la música que se está reproduciendo en tu aplicación de **TIDAL** (ya sea Escritorio, Móvil o Web) en tus transmisiones de **OBS Studio**, utilizando la API pública de **Last.fm**.

## 🛠️ Cómo Funciona la Sincronización

1. **TIDAL envía la música a Last.fm**: Al conectar tu cuenta de TIDAL con Last.fm, cada pista que escuches se reporta automáticamente en tu perfil ("scrobbling").
2. **El Widget lee Last.fm**: El widget consulta la API pública de Last.fm cada 5 segundos para comprobar si hay alguna canción activa con el estado `nowplaying` y la dibuja en pantalla.

---

## 🚀 Configuración en 3 Pasos

### Paso 1: Conectar TIDAL a Last.fm
1. Crea una cuenta gratuita en [Last.fm](https://www.last.fm/) si no tienes una.
2. Abre la aplicación de **TIDAL** (en tu celular o computadora).
3. Ve a **Configuración** -> **Conexiones** -> **Last.fm**.
4. Haz clic en **Conectar** e ingresa tus credenciales de Last.fm.
5. *¡Listo!* Reproduce cualquier canción en TIDAL para verificar que aparezca en tu perfil de Last.fm como "Listening now".

### Paso 2: Obtener tu API Key de Last.fm
1. Ve al portal de creación de API de Last.fm: [last.fm/api/account/create](https://www.last.fm/api/account/create).
2. Rellena los campos obligatorios (solo necesitas un nombre de contacto y una descripción corta como "OBS Widget"). Los campos de URL se pueden dejar vacíos.
3. Al hacer clic en **Submit**, verás tu **API Key** (una cadena larga de letras y números). Cópiala.

### Paso 3: Configurar el Widget

Tienes tres maneras de configurar tu usuario y API Key:

#### Opción A: A través de Variables de Entorno (Recomendado para Hosting)
Edita el archivo `.env` en la raíz de tu proyecto e ingresa tus claves:
```env
VITE_LASTFM_API_KEY=tu_api_key_de_lastfm
VITE_LASTFM_USER=tu_nombre_de_usuario_lastfm
```

#### Opción B: A través de la URL de OBS (Ideal para múltiples cuentas)
Puedes pasar los valores directamente en la URL de la fuente de navegador de OBS añadiendo parámetros de consulta:
`http://localhost:5173/?user=TU_USUARIO&key=TU_API_KEY`

#### Opción C: Interfaz Gráfica (Local)
Si abres `http://localhost:5173` en tu navegador y no has configurado las variables en el `.env`, verás una tarjeta de configuración. Ingresa tus datos ahí y se guardarán de forma segura en el almacenamiento local del navegador (`localStorage`).

---

## 📺 Configuración en OBS Studio

1. Inicia tu servidor local en la terminal de la carpeta `music_widget`:
   ```bash
   npm run dev
   ```
2. En OBS Studio, añade una nueva fuente de tipo **Navegador (Browser Source)**.
3. En el campo URL escribe:
   `http://localhost:5173/` (o la URL de tu hosting si lo subiste a Vercel/Cloudflare Pages).
4. Configura el **Ancho** en `340` y el **Alto** en `120` (adecuado para el tamaño del widget).
5. Marca la casilla **Refrescar navegador cuando la escena se active** para asegurarte de que empiece a buscar música inmediatamente al cambiar de escena.
6. Si deseas que el fondo sea totalmente transparente, asegúrate de que el CSS personalizado de OBS no sobrescriba el fondo o añade opacidad si lo deseas.

---

## 🌐 Hosting Gratuito (Vercel / Cloudflare)

Dado que es un widget estático, se puede hostear gratis en **Vercel** o **Cloudflare Pages**:
1. Conecta tu repositorio de GitHub a Vercel.
2. Añade las variables de entorno `VITE_LASTFM_API_KEY` y `VITE_LASTFM_USER` en el panel de Vercel.
3. Despliega la app.
4. En OBS, simplemente usa la URL pública que te dé Vercel (ej: `https://mi-widget-musica.vercel.app/`).
