# Script de Demo Video — NerdSubs (1-2 minutos)

## Preparación

1. Tener NerdSubs corriendo en `localhost:3000`
2. Tener un video de YouTube de Nerdearla listo (charla en inglés)
3. Tener Chrome abierto con NerdSubs
4. Grabadora de pantalla (OBS, Loom, o la nativa del OS)

## Script

### [0:00 - 0:10] Opening — Problema

**Pantalla**: Slide o título con el problema

> "Las conferencias tech tienen un problema: no todos hablan el mismo idioma. Nerdearla ofrece transcripción simultánea, pero las soluciones actuales son caras, dependen de operación manual, y no escalan."

### [0:10 - 0:20] Solución

**Pantalla**: Logo de NerdSubs + tagline

> "NerdSubs es una solución open source de transcripción simultánea para conferencias. Usa Gemini AI para transcribir y traducir audio en tiempo real, soportando múltiples escenarios en paralelo."

### [0:20 - 0:50] Demo en vivo

**Pantalla**: NerdSubs en el browser

1. **[0:20]** Mostrar la interfaz: selector de sesión, modo de idioma, botón de inicio
2. **[0:25]** Seleccionar "Main Stage" y modo "EN → ES"
3. **[0:30]** Hacé clic en "Start Listening" → permitir micrófono
4. **[0:35]** Abrir una charla de Nerdearla en YouTube (en inglés)
5. **[0:40]** Los subtítulos empiezan a aparecer en español
6. **[0:45]** Mostrar la latencia y el estado de conexión

> "Seleccionás la sesión, elegís el idioma, y listo. Los subtítulos aparecen en tiempo real. Miren: esta charla de Nerdearla en inglés está siendo traducida al español ahora mismo."

### [0:50 - 1:10] Multi-sesión

**Pantalla**: 2+ pestañas del browser

1. **[0:50]** Abrir una segunda pestaña con NerdSubs
2. **[0:55]** Seleccionar una sesión diferente en cada pestaña
3. **[1:00]** Ambas pestañas generando subtítulos independientemente

> "Y no es solo una sesión: NerdSubs puede procesar múltiples escenarios en simultáneo. Cada track opera de forma independiente."

### [1:10 - 1:30] Características clave

**Pantalla**: Lista de features o slides

> "Lo que hace especial a NerdSubs:
> - Transcripción precisa incluso con términos técnicos
> - Latencia de menos de 3 segundos
> - Multi-sesión sin costos prohibitivos
> - Deploy en un click con Vercel
> - 100% open source bajo licencia MIT"

### [1:30 - 1:45] Cierre

**Pantalla**: Logo + call to action

> "NerdSubs: la mejor solución abierta para que las conferencias sean accesibles para todos. Built for Nerdearla Vibeathon 2026."

### [1:45 - 2:00] Créditos (opcional)

**Pantalla**: Links y créditos

> "Repositorio: github.com/TU_USUARIO/nerdsubs
> Licencia: MIT
> AI: Gemini 2.0 Flash
> Built with Next.js, React, TypeScript"

---

## Tips para el video

1. **Audio claro**: Grabá en un lugar silencioso
2. **Pantalla limpia**: Cerrá apps innecesarias,usá un theme oscuro
3. **Velocidad natural**: No hables muy rápido, dejá que se vean los subtítulos
4. **Ejemplo real**: Usá una charla real de Nerdearla, no audio inventado
5. **Subtítulos del video**: Si te animás, agregá subtítulos en inglés hechos con tu propio proyecto (pro-tip del hackathon)
6. **Duración**: 1-2 minutos, ni más ni menos

## Grabadora de pantalla

### macOS
- Cmd + Shift + 5 → Grabar pantalla
- O usar [Loom](https://loom.com) (gratis)

### Windows
- Win + G → Xbox Game Bar
- O usar [OBS Studio](https://obsproject.com) (gratis)

### Linux
- [OBS Studio](https://obsproject.com)
- O `ffmpeg` con `ffmpeg -f x11grab -i :0.0 output.mp4`
