# Contribuir a NerdSubs

Gracias por tu interés en contribuir a NerdSubs! 🎉

## Guías rápidas

### Stack

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS v4
- **Backend**: Next.js API Routes
- **AI**: Google Gemini 2.0 Flash

### Setup del desarrollo

1. Cloná el repo
2. `npm install`
3. Copiá `.env.example` a `.env.local` y agregá tu API key
4. `npm run dev`

### Estructura del proyecto

```
src/
├── app/              # Pages y API routes (Next.js App Router)
├── components/       # Componentes React
├── context/          # Estado global (React Context + useReducer)
├── hooks/            # Custom hooks (audio capture, etc.)
└── lib/              # Servicios (Gemini, utils)
```

### Convenciones

- **TypeScript estricto**: No usar `any` salvo que sea realmente necesario
- **Componentes**: Un componente por archivo, named exports
- **Hooks**: Prefijar con `use`, un hook por archivo
- **Estilos**: Tailwind CSS, seguir el tema existente (`nerd-*` colors)
- **Commits**: [Conventional Commits](https://www.conventionalcommits.org/) (`feat:`, `fix:`, `docs:`, etc.)

### Pull Requests

1. Creá un branch nuevo (`feat/mi-feature`, `fix/mi-fix`)
2. Hagan los cambios
3. Aseguren que `npm run build` pase sin errores
4. Abrí un PR con:
   - Título descriptivo
   - Descripción de qué cambió y por qué
   - Screenshots si hay cambios visuales

### Issues

Si encontrás un bug o tenés una idea, abrí un issue con:
- **Título** claro y descriptivo
- **Pasos para reproducir** (si es bug)
- **Comportamiento esperado** vs **comportamiento actual**
- **Screenshots** si aplica

## Licencia

Al contribuir, aceptás que tus contribuciones serán licenciadas bajo MIT.
