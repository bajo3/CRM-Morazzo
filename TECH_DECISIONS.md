# TECH_DECISIONS.md

## 1. Stack de acceso a datos exacto
Se elige **Drizzle ORM** con PostgreSQL y `postgres-js`.

### Justificacion
- Es simple, fuertemente tipado y cercano a SQL.
- Evita la capa mas pesada y opinionada de Prisma para un MVP chico.
- Permite mantener control fino de tablas, enums, migraciones y seeds.
- Encaja bien con una arquitectura modular sin sobreingenieria.

### Decision final
- ORM / query builder: `drizzle-orm`
- Migraciones: `drizzle-kit`
- Driver PostgreSQL: `postgres`
- Base objetivo: PostgreSQL / Supabase

## 2. Que vive en `packages/shared`
`packages/shared` es el contrato comun entre frontend, backend y PDF.

### Contenido permitido
- tipos compartidos del dominio
- enums centralizados
- schemas y validaciones compartidas
- helpers puros de calculo
- helpers puros de formato
- reglas de estado y transiciones validas

### Contenido que no vive ahi
- acceso a base de datos
- componentes React
- handlers de Express
- dependencias de infraestructura

## 3. Reglas de calculo

### Unidades
- ancho y alto se guardan en milimetros enteros
- cantidades se guardan como enteros
- dinero se guarda en centavos

### Formula base
- `area_mm2 = width_mm * height_mm`
- `area_m2 = area_mm2 / 1000000`
- `total_area_m2 = area_m2 * quantity`
- `base_subtotal_cents = price_per_m2_cents * total_area_m2`

### Extras
Los extras se modelan con tres modos:
- `per_unit`: se multiplica por cantidad
- `per_m2`: se multiplica por `total_area_m2`
- `fixed`: se aplica una sola vez por item

### Reglas de redondeo
- El calculo intermedio puede usar decimal en memoria.
- Todo monto monetario final se redondea al centavo mas cercano con `Math.round`.
- El area mostrada al usuario puede formatearse con hasta 2 decimales.
- La persistencia final de montos siempre queda en enteros.

### Fuente unica de verdad
- Toda formula de calculo vive en `packages/shared/src/calculations`.
- Frontend usa esas funciones para previsualizacion.
- Backend usa esas mismas funciones para persistencia y validacion.
- El PDF usa resultados calculados por backend o helpers compartidos, nunca formulas duplicadas.

## 4. Base UI del sistema
Antes de pantallas de negocio, la web debe contar con:
- `AppShell`
- `Sidebar`
- `TopHeader`
- `DataTable`
- `FormField`
- `StatusBadge`
- `QuickActionCard`

### Criterios
- layout limpio y sobrio
- desktop first
- colores funcionales, no decorativos
- cards y tablas consistentes
- misma semantica visual para estados en toda la app

## 5. Migraciones y seeds como contrato
- migraciones iniciales reproducibles con Drizzle
- seeds idempotentes
- datos demo realistas de vidrieria
- scripts claros para levantar, migrar, seedear y resetear

### Scripts esperados
- `npm run db:generate`
- `npm run db:migrate`
- `npm run db:seed`
- `npm run db:reset`

## 6. IDs, numeracion y estados

### IDs
- Todos los registros principales usan `UUID v7` generado en aplicacion o DB.
- Se prioriza UUID para simplicidad, sincronizacion y seguridad de exposicion.

### Numeracion visible
- Presupuestos: `PRES-000001`, `PRES-000002`, ...
- Ordenes de trabajo: `OT-000001`, `OT-000002`, ...
- La numeracion visible es independiente del UUID.

### Enums exactos
- `quote_status`: `draft`, `sent`, `approved`, `rejected`, `in_progress`, `finished`, `delivered`, `paid`
- `work_order_status`: `pending`, `cutting`, `in_progress`, `ready`, `delivered`, `installed`
- `schedule_status`: `to_schedule`, `scheduled`, `completed`, `rescheduled`
- `payment_method`: `cash`, `bank_transfer`, `debit_card`, `credit_card`, `mercado_pago`, `other`
- `stock_movement_type`: `in`, `use`, `breakage`, `manual_adjustment`
- `cash_movement_type`: `income`, `expense`
- `extra_pricing_mode`: `per_unit`, `per_m2`, `fixed`
- `cash_income_category`: `deposit`, `sale`, `final_payment`, `manual_income`
- `cash_expense_category`: `glass_purchase`, `hardware`, `freight`, `salaries`, `misc`

### Transiciones validas
- Quote:
  - `draft -> sent | approved | rejected`
  - `sent -> approved | rejected`
  - `approved -> in_progress | paid`
  - `in_progress -> finished`
  - `finished -> delivered`
  - `delivered -> paid`
- Work order:
  - `pending -> cutting | in_progress`
  - `cutting -> in_progress`
  - `in_progress -> ready`
  - `ready -> delivered | installed`
- Schedule:
  - `to_schedule -> scheduled | rescheduled`
  - `scheduled -> completed | rescheduled`
  - `rescheduled -> scheduled`

## 7. Smoke flow obligatorio
Debe existir un recorrido minimo verificable:
1. crear cliente
2. crear presupuesto
3. calcular item con helper compartido
4. generar PDF
5. aprobar presupuesto
6. generar orden de trabajo
7. registrar pago
8. impactar caja

Este smoke flow debe poder correrse con datos demo o seeds.
