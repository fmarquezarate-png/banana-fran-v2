# BANANA & FRAN v2 — HANDOFF PARA CLAUDE CODE

**Fecha del handoff:** abril 2026  
**Owner:** Fran (Barcelona)  
**Pareja:** Ana  
**Stack objetivo:** React + Vite + TypeScript + Supabase + Netlify  
**Repositorio destino:** banana-fran-v2 (privado en GitHub fmarquezarate-png)

---

## ¿Qué es este proyecto?

App personal de planificación + seguimiento + registro histórico de viajes.

Empezó como un HTML único (versión 1) que sirve para descubrir destinos, calificarlos personalmente y cotizar precios. Esa versión está funcionando y será sustituida por esta v2.

La v2 expande el alcance:
- **Multi-viaje** — un viaje a Grecia agosto 2026, otro a Belgrado mayo 2027 (despedida de Pipe), viajes pasados…
- **Multi-dispositivo** — accesible desde móvil durante el viaje
- **Archivos reales** — PDFs de tickets de avión, reservas de hotel
- **Reseñas** — ratings de restaurantes, playas, sitios visitados
- **Fotos** — galería del viaje
- **Diario** — bitácora libre por día

---

## Plan completo de 14 tareas

### FASE 1 — Fundaciones
- Tarea 1: Diseño del esquema de datos ✅ HECHA
- Tarea 2: Setup de infraestructura ✅ HECHA

### FASE 2 — Migración del frontend
- Tarea 3: Bootstrapping del proyecto React ✅ HECHA
- Tarea 4: Migración de los 30 destinos estáticos
- Tarea 5: Sistema de navegación y rutas

### FASE 3 — Autenticación y perfil
- Tarea 6: Login con Supabase Auth (magic link)
- Tarea 7: Página de perfil editable

### FASE 4 — Sistema de viajes
- Tarea 8: Crear y listar viajes
- Tarea 9: Agregar destinos a un viaje
- Tarea 10: Migrar ratings + cotizaciones a Supabase

### FASE 5 — Archivos reales
- Tarea 11: Subida de tickets y reservas (Storage)
- Tarea 12: Galería de fotos del viaje

### FASE 6 — Review y diario
- Tarea 13: Rating de sitios visitados
- Tarea 14: Diario del viaje

---

## Decisiones de arquitectura tomadas

| Decisión | Elección |
|---|---|
| Backend | Supabase (Auth + DB + Storage) |
| Frontend | React 18 + Vite + TypeScript |
| Routing | React Router v6 |
| Styling | Tailwind CSS (replicar paleta del HTML v1) |
| Deploy | Netlify (auto-deploy desde GitHub main) |
| Auth | Supabase Auth con magic link por email (sin contraseñas) |
| Modo de uso | Single-user (solo Fran). Ana puede ver pero no editar (futuro) |
| Estado del viaje | Auto-calculado por fechas, con override manual |
| Categorías sitios | Fijas: restaurant, bar, beach, museum, cultural_site, activity, viewpoint, nature, shopping, accommodation, other |
| Tags sitios | Libres, además de categorías |
| Diario | Flexible: 0, 1 o N entradas por día |
| Gastos detallados | Pospuesto a v2.1 (no incluir ahora) |

---

## Estética a preservar de v1

La v1 tiene una identidad visual cuidada que hay que mantener:
- **Paleta:** blanco roto, azul egeo (#1e6fb5), arena, coral (#e8785a)
- **Fonts:** Fraunces (display) + Manrope (body) + JetBrains Mono (mono)
- **Modo Warning:** rojo neón / negro / amarillo con stripes diagonales
- **Tarjetas:** Netflix-style con scroll horizontal
- **Match badges:** ⭐ / 💛 / 🌊 / 🏛️ / 🌿
- **Mapa:** Leaflet con OpenStreetMap

---

## Esquema de datos (resumen)

9 tablas en PostgreSQL (Supabase):

```
profiles ──────────┬─ destinations_user
                   ├─ destination_quotations
                   └─ trips ─┬─ trip_destinations
                              ├─ trip_documents
                              ├─ trip_places ──── trip_photos
                              ├─ trip_photos
                              └─ trip_journal
```

Detalle completo: ver `supabase/schema.sql`

**Storage buckets a crear:**
- `avatars` (público, 5MB/file)
- `documents` (privado, 20MB/file)
- `photos` (privado con signed URLs, 15MB/file)

---

## Estructura de carpetas

```
banana-fran-v2/
├── src/
│   ├── components/
│   │   ├── ui/          (botones, inputs, modal genérico)
│   │   ├── destinations/ (DestinationCard, DestinationModal, ...)
│   │   ├── trips/       (TripCard, CreateTripModal, ...)
│   │   ├── places/      (PlaceCard, ReviewForm, ...)
│   │   └── layout/      (TopBar, Footer, ...)
│   ├── pages/
│   │   ├── HomePage.tsx
│   │   ├── DestinationPage.tsx
│   │   ├── ProfilePage.tsx
│   │   ├── TripsPage.tsx
│   │   ├── TripDetailPage.tsx
│   │   ├── TripPhotosPage.tsx
│   │   ├── TripJournalPage.tsx
│   │   └── LoginPage.tsx
│   ├── data/
│   │   └── destinations.ts
│   ├── lib/
│   │   ├── supabase.ts
│   │   ├── storage.ts
│   │   └── budget.ts
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useProfile.ts
│   │   ├── useTrips.ts
│   │   └── useDestinationRating.ts
│   ├── types/
│   │   └── database.ts
│   ├── App.tsx
│   └── main.tsx
├── supabase/
│   └── schema.sql
├── public/
├── .env.example
├── vite.config.ts
├── tailwind.config.js
├── tsconfig.json
├── package.json
└── README.md
```

---

## Convenciones del proyecto

1. **Idioma del código:** inglés (variables, funciones, componentes)
2. **Idioma del UI:** español (textos visibles para Fran)
3. **Comentarios:** español, breves, solo cuando aporten
4. **Commits:** mensajes claros tipo `"feat: add trip creation form"` / `"fix: rating overlay z-index"`
5. **Branch strategy:** trabajo directamente en main (proyecto personal, sin PRs)
6. **Estilo de código:** Prettier + ESLint configurados
7. **Tipos:** todo tipado, no `any` salvo casos extremos
8. **Errores:** todo lo que toque Supabase debe manejar errores (try/catch + toast al usuario)
9. **Loading states:** siempre mostrar feedback visual mientras se carga
10. **Mobile-first:** diseñar para móvil y luego escalar

---

## Cosas a NO hacer

- No usar localStorage para datos importantes — todo va a Supabase
- No hardcodear claves de Supabase — siempre .env
- No instalar librerías pesadas sin justificación (Material-UI, Ant Design…) — Tailwind suficiente
- No crear más tablas sin justificación — el esquema actual cubre todo
- No reescribir el catálogo de destinos — mantener los datos del HTML v1 tal cual
