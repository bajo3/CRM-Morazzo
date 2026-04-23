# Supabase Setup

## Arquitectura confirmada

Este proyecto esta diseñado como:

`frontend -> API propia -> Supabase Postgres por DATABASE_URL`

En otras palabras:

- `apps/web` habla solo con `apps/api`
- `apps/api` habla con Supabase Postgres usando `postgres-js` + Drizzle
- el frontend **no** usa `supabase-js`
- el frontend **no** se conecta directo a Supabase

## Variables de entorno reales

### API

Obligatorias para `apps/api`:

```env
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres?sslmode=require
PORT=4000
```

`DATABASE_URL` se copia desde:

`Supabase Dashboard > Project Settings > Database > Connection string > URI`

Usar la **conexion directa** de Supabase, no pooler.

### Web

Obligatoria para `apps/web`:

```env
VITE_API_URL=http://localhost:4000/api
```

## Variables que NO hacen falta

Para esta arquitectura no necesitas:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

No se usan en este proyecto porque la app web no consulta Supabase en forma directa.

## Flujo recomendado de base de datos

### Recomendado para trabajar dia a dia

Usar **Drizzle migrations** contra Supabase:

```bash
npm run db:migrate
```

Motivos:

- deja el esquema versionado
- evita drift entre codigo y base
- mantiene la evolucion del proyecto dentro del repo
- sigue usando la misma `DATABASE_URL` de Supabase

Migracion versionada:

- `apps/api/drizzle/0000_supabase_initial.sql`

### Opcion manual para bootstrap o auditoria

Si quieres ejecutar el esquema desde Supabase SQL Editor:

- correr `apps/api/supabase/001_initial_schema.sql`

Ese archivo contiene el SQL inicial completo, incluyendo:

- tablas
- enums
- foreign keys
- indices
- funciones
- secuencias
- triggers de `updated_at`
- numeracion visible `PRES-000001` y `OT-000001`

## Seeds

Recomendado:

```bash
npm run db:seed
```

Motivos:

- reutiliza los datos demo versionados en TypeScript
- mantiene alineados calculos, IDs y numeracion visible
- actualiza las secuencias visibles al finalizar

## Orden de bootstrap

1. Crear el proyecto en Supabase.
2. Configurar `DATABASE_URL` y `PORT` en `.env`.
3. Configurar `VITE_API_URL` en `.env`.
4. Ejecutar `npm run db:migrate`.
5. Ejecutar `npm run db:seed`.
6. Ejecutar `npm run dev`.

## Criterio arquitectonico

En este proyecto conviene mantener lecturas y escrituras pasando por la API propia.

Motivos:

- centraliza validaciones de negocio y reglas del dominio
- evita duplicar logica entre frontend y base
- protege mejor notas internas y logica operativa
- simplifica PDF, conversion de presupuesto a orden, pagos y movimientos de caja
- mantiene la puerta abierta a auth y permisos mas adelante sin reescribir el frontend
