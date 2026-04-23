# DB_RULES.md

## Convenciones de tablas
- Nombres en `snake_case`, plural cuando represente colecciones del dominio.
- Evitar abreviaturas ambiguas.
- Tablas iniciales esperadas:
  - `clients`
  - `quotes`
  - `quote_items`
  - `work_orders`
  - `work_order_items`
  - `glass_types`
  - `service_extras`
  - `stock_sheets`
  - `stock_movements`
  - `cash_movements`
  - `payments`
  - `schedule_entries`
  - `templates`

## Convenciones de columnas
- Primary key: `id` UUID v7.
- Foreign keys: `<entity>_id`.
- Estados: `<entity>_status` solo si agrega claridad; si no, usar `status`.
- Campos booleanos con prefijo `is_` o `has_`.
- Texto libre en `notes` o `internal_notes` segun visibilidad.
- Numeracion visible separada en:
  - `quote_number`
  - `work_order_number`

## Manejo de dinero
- Guardar dinero en enteros de menor unidad monetaria, por ejemplo `amount_cents`.
- No usar `float` ni `double precision` para montos.
- Guardar subtotales y totales calculados relevantes para auditoria operativa.
- Si se necesita porcentaje, usar `numeric` con precision definida.
- Redondear a centavos con `Math.round` en la capa de calculo compartida.

## Medidas
- Guardar ancho y alto en milimetros enteros.
- Guardar area calculada cuando aporte performance o auditoria, pero recalcular en backend cuando sea clave.
- Cantidades siempre en enteros salvo que un caso real justifique otra cosa.
- La formula base y los extras viven en `packages/shared`.

## Timestamps
- Todas las tablas operativas deben tener:
  - `created_at`
  - `updated_at`
- En tablas con ciclo de vida claro, agregar:
  - `deleted_at` solo si se adopta soft delete
  - `approved_at`, `sent_at`, `paid_at`, etc. solo donde aporten valor operativo real

## Enums y estados
- Centralizar enums de estado y tipo de movimiento.
- No crear estados duplicados con significados superpuestos.
- Estados iniciales propuestos:
  - `quotes.status`: `draft`, `sent`, `approved`, `rejected`, `in_progress`, `finished`, `delivered`, `paid`
  - `work_orders.status`: `pending`, `cutting`, `in_progress`, `ready`, `delivered`, `installed`
  - `schedule_entries.status`: `to_schedule`, `scheduled`, `completed`, `rescheduled`
  - `stock_movements.type`: `in`, `use`, `breakage`, `manual_adjustment`
  - `cash_movements.type`: `income`, `expense`
- Tambien centralizar:
  - `payment_method`
  - `extra_pricing_mode`
  - categorias de caja de ingreso y egreso

## Relaciones
- `quotes.client_id -> clients.id`
- `quote_items.quote_id -> quotes.id`
- `work_orders.client_id -> clients.id`
- `work_orders.quote_id -> quotes.id` si deriva de presupuesto
- `work_order_items.work_order_id -> work_orders.id`
- `payments.quote_id -> quotes.id` opcional
- `payments.work_order_id -> work_orders.id` opcional
- `payments.client_id -> clients.id`
- `stock_movements.stock_sheet_id -> stock_sheets.id`
- `schedule_entries.client_id -> clients.id`
- `schedule_entries.work_order_id -> work_orders.id` opcional

## Reglas para estados
- Un presupuesto aprobado puede originar una orden de trabajo.
- Una orden de trabajo no debe existir sin cliente.
- Un pago puede impactar saldo de presupuesto o de orden, pero debe quedar trazable.
- Un movimiento de caja relacionado a pago debe conservar referencia al origen.
- Las observaciones internas deben persistirse separadas de cualquier texto para cliente.

## Soft delete
- Aplicar solo donde tenga valor real para recuperacion o auditoria operativa.
- Recomendado para:
  - `clients`
  - `templates`
  - configuraciones simples
- No usar soft delete por defecto en todas las tablas.
- Para movimientos financieros y stock, preferir no borrar: usar anulacion o ajuste compensatorio.

## Seeds y datos mock
- Deben incluir clientes, tipos de vidrio, extras, plantillas, presupuestos, ordenes, movimientos de caja y agenda.
- Tienen que permitir validar el flujo principal completo sin carga manual extensa.
- Deben ser idempotentes y reproducibles.
