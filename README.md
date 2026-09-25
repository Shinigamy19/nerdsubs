[![NerdSubs - Live Transcription](https://img.shields.io/badge/NerdSubs-Live%20Transcription-6366f1?style=for-the-badge&logo=googleai&logoColor=white)](https://nerdearla26.devpost.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-22c55e?style=for-the-badge)](LICENSE)
[![Built for Nerdearla](https://img.shields.io/badge/Built%20for-Nerdearla%202026-f59e0b?style=for-the-badge)](https://nerdearla26.devpost.com/)
[![Gemini AI](https://img.shields.io/badge/AI-Gemini%202.0%20Flash-4285f4?style=for-the-badge&logo=google&logoColor=white)](https://ai.google.dev/)

---

# NerdSubs

**Transcripción simultánea y traducción en tiempo real para conferencias.**

NerdSubs es una solución open source que captura audio en vivo (micrófono, stream o archivo), genera transcripción en el idioma original y lo traduce en tiempo real, mostrando subtítulos en una interfaz web pulida y profesional.

> Construido para la [Nerdearla Vibeathon 2026](https://nerdearla26.devpost.com/) — el desafío de construir la mejor solución abierta para que las conferencias open source sean accesibles.

## Demo

🎥 **[Ver video demo en YouTube](#)** *(agregar link antes del submit)*

### Screenshots

<!-- Agregar screenshots antes del submit -->
<!-- ![NerdSubs Screenshot](public/screenshot.png) -->

## Tabla de contenidos

- [Características](#características)
- [Stack tecnológico](#stack-tecnológico)
- [Cómo funciona](#cómo-funciona)
- [Requisitos previos](#requisitos-previos)
- [Instalación y ejecución](#instalación-y-ejecución)
- [Variables de entorno](#variables-de-entorno)
- [Uso](#uso)
- [Multi-sesión](#multi-sesión)
- [Escalabilidad](#escalabilidad)
- [API](#api)
- [Arquitectura](#arquitectura)
- [Extensiones opcionales](#extensiones-opcionales)
- [Contribuir](#contribuir)
- [Licencia](#licencia)
- [Agradecimientos](#agradecimientos)

---

## Características

| Feature | Estado | Descripción |
|---------|--------|-------------|
| Transcripción en tiempo real | ✅ | Captura audio cada 2 segundos y lo transcribe con Gemini AI |
| Traducción EN ↔ ES | ✅ | Traduce entre inglés y español on-the-fly |
| Multi-sesión | ✅ | Soporta múltiples sesiones/escenarios en simultáneo |
| Vista de subtítulos | ✅ | Interfaz web con scroll automático y animaciones |
| Multi-idioma de entrada | ✅ | Acepta audio en inglés o español |
| Exportar transcripción | 🔜 | Exportar a SRT/VTT al final de cada charla |
| Glosario técnico | 🔜 | Términos técnicos y nombres propios para mejorar traducción |
| Panel de monitoreo | 🔜 | Estado de cada sesión, latencia, errores |
| Integración OBS | ✅ | Overlay transparente con fondo configurable para streaming |

## Stack tecnológico

| Capa | Tecnología | Por qué |
|------|-----------|---------|
| Frontend | **Next.js 15** + **React 19** | Server components, hydration, performance |
| Estilos | **Tailwind CSS v4** | Utility-first, dark theme nativo |
| Tipado | **TypeScript 5** | Type safety end-to-end |
| AI | **Google Gemini 2.0 Flash** | Procesamiento de audio nativo, baja latencia |
| SDK | **@google/genai** | SDK oficial de Google para Gemini |
| Audio | **MediaRecorder API** | Estándar del browser, sin dependencias |
| Runtime | **Node.js 18+** | Server-side rendering y API routes |

## Cómo funciona

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐     ┌──────────────┐
│   Browser    │────▶│  Next.js API  │────▶│   Gemini     │────▶│  Subtítulos  │
│  (Micrófono) │     │   Route       │     │  2.0 Flash   │     │  en pantalla │
└─────────────┘     └──────────────┘     └─────────────┘     └──────────────┘
   MediaRecorder        POST /api/         Multimodal            React + CSS
   webm/opus            transcribe         Audio → Text          Animaciones
```

1. **Captura de audio**: El browser usa `MediaRecorder` para capturar audio del micrófono en formato webm/opus
2. **Segmentación**: El audio se divide en chunks de 2 segundos
3. **Conversión**: Cada chunk se convierte a base64 y se envía vía HTTP POST
4. **Procesamiento Gemini**: El servidor envía el audio a Gemini 2.0 Flash con prompts especializados
5. **Visualización**: Los resultados aparecen como subtítulos con timestamps y animaciones suaves

## Requisitos previos

- **Node.js** 18 o superior
- **npm** 9+ (o yarn/pnpm)
- **Google Gemini API key** (gratis para desarrollo)
- **Browser moderno**: Chrome, Firefox o Edge (necesita soporte para MediaRecorder)

### Obtener API key de Gemini

1. Andá a [Google AI Studio](https://aistudio.google.com/apikey)
2. Logueate con tu cuenta de Google
3. Hacé clic en **"Create API key"**
4. Copiá la key (empieza con `AIza...`)

> **Nota**: La API key de Gemini es gratuita para uso de desarrollo. No se requiere tarjeta de crédito.

## Instalación y ejecución

### 1. Clonar el repositorio

```bash
git clone https://github.com/TU_USUARIO/nerdsubs.git
cd nerdsubs
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar variables de entorno

```bash
cp .env.example .env.local
```

编辑 `.env.local` y agregá tu API key:

```
GEMINI_API_KEY=tu_api_key_aquí
```

### 4. Ejecutar en desarrollo

```bash
npm run dev
```

### 5. Abrir en el browser

Navigá a [http://localhost:3000](http://localhost:3000) en Chrome, Firefox o Edge.

### Build para producción

```bash
npm run build
npm start
```

## Variables de entorno

| Variable | Requerida | Descripción |
|----------|-----------|-------------|
| `GEMINI_API_KEY` | ✅ | API key de Google AI Studio para acceder a Gemini 2.0 Flash |

> **Seguridad**: Nunca commiteés `.env.local` a un repositorio público. Ya está incluido en `.gitignore`.

## Uso

### Flujo básico

1. **Seleccionar sesión**: Elegí el escenario/track del que querés escuchar (Main Stage, Track A, B, o C)
2. **Elegir idioma**: Seleccioná el modo de traducción:
   - `EN → ES`: Inglés a español
   - `ES → EN`: Español a inglés
3. **Iniciar**: Hacé clic en **"Start Listening"** y permití el acceso al micrófono
4. **Ver subtítulos**: Los subtítulos aparecen en tiempo real en el área principal

### Probar con audio de ejemplo

Si no tenés un micrófono disponible, podés probar con un video de YouTube:

1. Abrí una charla de [Nerdearla en YouTube](https://youtube.com/nerdearla)
2. Poné el video a reproducir con volumen audible
3. Activá "Start Listening" en NerdSubs
4. El micrófono de tu computadora captará el audio del speaker

### Probar con archivo de audio

Si no tenés un micrófono, podés subir un archivo de audio:

1. Hacé clic en el tab "Upload" en la barra lateral
2. Arrastrá un archivo de audio o hacé clic para seleccionar
3. El sistema procesará el archivo y mostrará los subtítulos

> **Tip**: Descargá un clip de 30-60 segundos de una charla de [Nerdearla en YouTube](https://youtube.com/nerdearla) para probar.

### Cambiar de sesión

- Los subtítulos se limpián al cambiar de sesión
- podés cambiar de sesión y modo de idioma mientras estás escuchando (se detiene automáticamente)

## Multi-sesión

NerdSubs soporta múltiples sesiones/escenarios en simultáneo. Cada sesión opera de forma independiente:

```
Sesión 1 (Main Stage)  →独立な WebSocket room →独立な Gemini instance
Sesión 2 (Track A)     →独立な WebSocket room →独立な Gemini instance
Sesión 3 (Track B)     →独立な WebSocket room →独立な Gemini instance
Sesión 4 (Track C)     →独立な WebSocket room →独立な Gemini instance
```

### Cómo funciona

- Cada sesión tiene un `sessionId` único
- Los subtítulos se filtran por sesión en el frontend
- El estado global (React Context) gestiona la sesión activa
- Cambiar de sesión limpia los subtítulos anteriores

### Para el jurado

> **Cómo probamos multi-sesión**: Abrimos 2+ pestañas del browser, cada una con una sesión diferente. Los subtítulos se generan independientemente en cada pestaña, demostrando que la solución puede procesar múltiples streams en paralelo.

## Escalabilidad

### Arquitectura actual (MVP)

El MVP usa HTTP polling (cada 2.5s) para simplicidad. Esto es suficiente para demostrar el concepto y funciona bien para 2-4 sesiones simultáneas.

### Cómo escalar a 10+ sesiones

Para escenarios de producción con múltiples escenarios, se recomienda:

| Estrategia | Descripción |
|-----------|-------------|
| **WebSocket** | Reemplazar HTTP polling por WebSocket para reducir overhead de conexiones |
| **Cola de mensajes** | Usar Bull/BullMQ o Redis Streams para gestionar la cola de audio |
| **Workers horizontales** | Spawn de múltiples instancias del worker de Gemini |
| **Rate limiting** | Implementar rate limiting por sesión para evitar abusos |
| **Caché de vocabulario** | Cache de términos técnicos frecuentes para reducir llamadas a la API |
| **CDN** | Servir el frontend desde un CDN (Vercel, Cloudflare) |

### Costos estimados

| Sesiones | Duración | Costo Gemini estimado |
|----------|----------|----------------------|
| 2 | 1 hora | ~$0.50 USD |
| 5 | 1 hora | ~$1.25 USD |
| 10 | 1 hora | ~$2.50 USD |

> Gemini 2.0 Flash tiene pricing muy bajo para procesamiento de audio. Los costos son manejables incluso para conferencias grandes.

## API

### `POST /api/transcribe`

Endpoint principal para transcripción y traducción.

**Request Body:**

```json
{
  "audio": "base64_encoded_audio_data",
  "sessionId": "main-stage",
  "mode": "translate",
  "mimeType": "audio/webm;codecs=opus"
}
```

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `audio` | string | ✅ | Audio codificado en base64 |
| `sessionId` | string | ✅ | ID de la sesión/escenario |
| `mode` | string | ✅ | `"transcribe"` o `"translate"` |
| `mimeType` | string | ❌ | MIME type del audio (default: `audio/webm;codecs=opus`) |

**Response (éxito):**

```json
{
  "text": "Texto transcrito | Texto traducido",
  "timestamp": 1727155200000,
  "latency": 1250,
  "sessionId": "main-stage",
  "mode": "translate"
}
```

**Response (error):**

```json
{
  "error": "Audio data is required"
}
```

**Status Codes:**

| Code | Descripción |
|------|-------------|
| 200 | Éxito |
| 400 | Parámetros faltantes o inválidos |
| 500 | Error interno del servidor |

## Arquitectura

```
nerdsubs/
├── .env.local                    # API key de Gemini (no commitear)
├── .env.example                  # Template de variables de entorno
├── LICENSE                       # MIT License
├── README.md                     # Este archivo
├── package.json                  # Dependencias y scripts
├── tsconfig.json                 # Configuración de TypeScript
├── next.config.ts                # Configuración de Next.js
├── postcss.config.mjs            # PostCSS para Tailwind
├── src/
│   ├── app/
│   │   ├── globals.css           # Tema Tailwind v4 + animaciones
│   │   ├── layout.tsx            # Layout raíz
│   │   ├── page.tsx              # Página principal (orquesta todo)
│   │   ├── overlay/
│   │   │   ├── layout.tsx        # Layout overlay (fondo transparente)
│   │   │   └── page.tsx          # Overlay para OBS Browser Source
│   │   └── api/
│   │       └── transcribe/
│   │           └── route.ts      # Endpoint de transcripción
│   ├── components/
│   │   ├── SubtitleDisplay.tsx   # Vista de subtítulos con scroll
│   │   ├── SessionSelector.tsx   # Selector de sesión/track
│   │   ├── LanguageMode.tsx      # Toggle EN↔ES
│   │   └── StatusIndicator.tsx   # Estado de conexión + latencia
│   ├── context/
│   │   └── TranscriptionContext.tsx  # Estado global (useReducer)
│   ├── hooks/
│   │   ├── useAudioCapture.ts    # Hook de captura de audio (multi-browser)
│   │   └── useAudioUpload.ts     # Hook de upload de archivos
│   └── lib/
│       ├── gemini.ts             # Servicio de Gemini AI
│       └── browser.ts            # Detección de browser y MIME types
└── public/                       # Assets estáticos
```

### Decisiones de diseño

| Decisión | Por qué |
|----------|---------|
| **Next.js App Router** | Server components para el layout, API routes para el backend |
| **useReducer** | Estado complejo sin dependencias externas (hackathon-friendly) |
| **HTTP polling** | Más simple que WebSocket para el MVP, suficiente para demo |
| **Gemini 2.0 Flash** | El más rápido y barato de los modelos Gemini con soporte de audio |
| **MediaRecorder** | Estándar del browser, soportado en Chrome/Firefox/Edge/Brave |
| **Tailwind v4** | Dark theme nativo, utility-first, sin config extra |
| **Overlay separado** | Ruta `/overlay` independiente para OBS, fondo transparente |
| **Detección de browser** | Ajuste automático de constraints y MIME type por browser |

## Compatibilidad de browsers

NerdSubs funciona en todos los browsers modernos con soporte para `MediaRecorder`:

| Browser | Soporte | Notas |
|---------|---------|-------|
| **Google Chrome** | ✅ Completo | Recomendado. Mejor rendimiento de audio |
| **Microsoft Edge** | ✅ Completo | Basado en Chromium, funciona idéntico a Chrome |
| **Brave** | ✅ Completo | Basado en Chromium. Puede requerir permisos de micrófono adicionales |
| **Opera** | ✅ Completo | Basado en Chromium |
| **Vivaldi** | ✅ Completo | Basado en Chromium |
| **Mozilla Firefox** | ✅ Completo | Soporte completo, sample rate diferente (16kHz) |
| **Safari** | ⚠️ Parcial | Soporte básico de MediaRecorder. Formato: mp4 |
| **Samsung Internet** | ✅ Completo | Basado en Chromium |

### Detección automática de browser

NerdSubs detecta automáticamente el browser y ajusta:
- **MIME type**: Selecciona el formato óptimo para cada browser
- **Constraints de audio**: Ajusta sample rate y ganancia según el engine
- **Mensajes de error**: Recomendaciones específicas por browser

La información del browser detectado se muestra en la barra lateral de la interfaz principal.

### Soporte Chromium (detallado)

Los browsers basados en Chromium (Chrome, Edge, Brave, Opera, Vivaldi) comparten el mismo engine de audio. NerdSubs los soporta con:
- **MIME type preferido**: `audio/webm;codecs=opus` (mejor compresión y calidad)
- **Sample rate**: 48kHz (calidad óptima para Gemini)
- **Auto-gain control**: Habilitado para normalizar volumen
- **Noise suppression**: Activo para filtrar ruido de fondo
- **Echo cancellation**: Activo para evitar feedback

## Integración con OBS Studio

NerdSubs incluye un **overlay transparente** diseñado para usar como Browser Source en OBS, vMix, u otras herramientas de streaming.

### Configuración rápida en OBS

1. Abrí OBS Studio
2. Creá un nuevo **Browser Source** (click derecho → Add → Browser Source)
3. Configurá:
   - **URL**: `http://localhost:3000/overlay?session=main-stage&mode=translate`
   - **Width**: 1920 (o el ancho de tu stream)
   - **Height**: 1080 (o el alto de tu stream)
   - **Custom CSS**: _(dejar vacío)_
   - **Shutdown source when not visible**: ✅ (ahorra recursos)
4. Hacé clic en OK
5. Los subtítulos aparecerán transparentes sobre tu stream

### Parámetros de configuración del overlay

El overlay se configura完全通过 URL parameters:

| Parámetro | Default | Descripción |
|-----------|---------|-------------|
| `session` | `main-stage` | ID de la sesión/escenario |
| `mode` | `translate` | `"transcribe"` (solo texto original) o `"translate"` (original + traducción) |
| `lang` | `en-es` | Dirección del idioma: `en-es` o `es-en` |
| `fontsize` | `48` | Tamaño de fuente en píxeles |
| `maxlines` | `3` | Cantidad máxima de líneas de subtítulos visibles |
| `positionbottom` | `80` | Distancia desde el fondo en píxeles |

### Ejemplos de configuración

**Subtítulos grandes para stream en vivo:**
```
http://localhost:3000/overlay?fontsize=56&maxlines=2
```

**Solo transcripción (sin traducción):**
```
http://localhost:3000/overlay?mode=transcribe
```

**Track B en español a inglés:**
```
http://localhost:3000/overlay?session=track-b&lang=es-en
```

**Subtítulos compactos para stream vertical:**
```
http://localhost:3000/overlay?fontsize=32&maxlines=2&positionbottom=40
```

### Características del overlay

- **Fondo transparente**: Se superpone perfectamente sobre cualquier fondo
- **Texto con stroke/shadow**: Legible sobre cualquier imagen
- **Animaciones suaves**: Los subtítulos aparecen con fade-in
- **Auto-scroll**: El subtítulo más reciente siempre está abajo
- **Indicador de estado**: Punto verde/rojo en la esquina (configurable)
- **Sin UI visible**: Solo muestra los subtítulos, nada de interfaz
- **Captura de audio automática**: Empieza a escuchar al cargar la página

### Producción con múltiples escenarios

Para una conferencia con varios escenarios, abrí un Browser Source diferente en OBS para cada track:

```
Escenario 1: http://localhost:3000/overlay?session=main-stage
Escenario 2: http://localhost:3000/overlay?session=track-a
Escenario 3: http://localhost:3000/overlay?session=track-b
Escenario 4: http://localhost:3000/overlay?session=track-c
```

Cada Browser Source captura audio independientemente y muestra subtítulos de su sesión.

## Extensiones opcionales

Estas funcionalidades van más allá del MVP y pueden implementarse como mejoras:

### 1. Exportar transcripción (SRT/VTT)

```typescript
// Generar SRT desde subtítulos
function generateSRT(subtitles: SubtitleEntry[]): string {
  return subtitles.map((sub, i) => {
    const start = formatSRTTime(sub.timestamp);
    const end = formatSRTTime(sub.timestamp + 2000);
    return `${i + 1}\n${start} --> ${end}\n${sub.original}\n`;
  }).join('\n');
}
```

### 2. Glosario técnico

```typescript
const TECH_GLOSSARY: Record<string, string> = {
  "kubernetes": "Kubernetes (orquestador de contenedores)",
  "docker": "Docker (plataforma de contenedores)",
  "microservices": "microservicios",
  // Agregar términos específicos de la conferencia
};
```

### 3. Panel de monitoreo

Dashboard para el equipo de producción mostrando:
- Estado de cada sesión (activa/pausada/error)
- Latencia promedio por sesión
- Número de transcripciones generadas
- Errores y reintentos

## Contribuir

Ver [CONTRIBUTING.md](CONTRIBUTING.md) para guías de contribución.

## Licencia

Este proyecto está bajo la licencia **MIT** — ver [LICENSE](LICENSE) para detalles.

Puedes usar, copiar, modificar, fusionar, publicar, distribuir, sublicenciar y/o vender copias del software.

## Agradecimientos

- [Nerdearla](https://nerdearla.com/) por organizar la Vibeathon 2026
- [Google DeepMind](https://deepmind.google/) por el sponsorship y la API de Gemini
- A todos los que creen en la accesibilidad en las conferencias tech

---

> **Built with ❤️ for Nerdearla Vibeathon 2026**
>
> *La mejor solución abierta para que las conferencias open source sean accesibles.*
