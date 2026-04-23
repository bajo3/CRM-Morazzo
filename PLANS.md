# PLANS.md

## Estado actual
- FASE 0 completa.
- Base tecnica del monorepo en preparacion.
- Aun no hay modulos funcionales del MVP implementados.

## Roadmap por fases

### FASE 0 - Preparacion para Codex
- Crear AGENTS.md
- Crear PLANS.md
- Crear PRODUCT.md
- Crear UI_RULES.md
- Crear DB_RULES.md
- Crear carpeta `skills/` con guias reutilizables

### FASE 1 - Analisis y plan
- Revisar estructura existente
- Definir arquitectura y estructura de carpetas
- Definir entidades, relaciones y estados
- Definir supuestos y riesgos
- Ordenar backlog de implementacion

### FASE 2 - Base tecnica
- Inicializar frontend con React + Vite + TypeScript + Tailwind
- Inicializar backend con Express + TypeScript
- Fijar `Drizzle ORM` como capa de acceso a datos
- Crear `packages/shared` como contrato comun
- Configurar PostgreSQL / Supabase
- Definir migraciones iniciales
- Definir seeds/mock data
- Configurar lint, format y typecheck

### FASE 3 - Core comercial
- Clientes
- Configuracion de precios
- Calculadora rapida
- Presupuestos y quote_items
- PDF de presupuesto

### FASE 4 - Operacion
- Ordenes de trabajo
- Pagos, seña y saldo
- Caja
- Historial por cliente

### FASE 5 - Operacion extendida MVP
- Stock simple de hojas
- Agenda de entregas/colocaciones
- Alertas simples
- Dashboard operativo
- Plantillas de trabajos frecuentes

### FASE 6 - Cierre MVP
- Verificaciones finales
- Ajustes de UX
- Limpieza tecnica
- Documentacion de handoff

## Backlog del MVP
- Dashboard
- Clientes
- Presupuestos
- Nuevo presupuesto
- Calculadora rapida
- Ordenes de trabajo
- Stock de hojas
- Caja
- Agenda
- Configuracion basica de precios
- Historial por cliente
- Alertas simples
- Plantillas

## Criterios de prioridad
1. Priorizar primero el flujo que genera venta: cliente -> presupuesto -> PDF -> aprobacion.
2. Luego cubrir operacion diaria: orden de trabajo -> agenda -> cobro.
3. Luego control operativo: caja -> stock -> alertas -> dashboard.
4. Posponer todo lo que agregue complejidad sin impacto directo en el MVP.

## Riesgos
- Crecer demasiado el alcance hacia ERP.
- Duplicar logica de calculo entre frontend, backend y PDF.
- Manejar dinero con `float` en vez de enteros.
- Multiplicar estados sin criterio unificado.
- UI con demasiada densidad visual o formularios lentos.
- Desacoplar mal quote y work order, generando inconsistencias.
- Seeds pobres que no permitan validar el flujo completo.

## Supuestos actuales
- Usuario interno unico o muy pocos usuarios.
- Una sola vidrieria / una sola sucursal.
- Moneda unica.
- Precios configurables de forma simple.
- El PDF de presupuesto se genera en backend.
- No se requiere auth compleja en MVP.
- La fuente unica de calculo vive en `packages/shared`.

## Checklist de implementacion
- [x] Completar documentacion base
- [x] Crear skills reutilizables
- [ ] Definir estructura del repo
- [ ] Inicializar frontend
- [ ] Inicializar backend
- [ ] Configurar DB y migraciones
- [ ] Crear seeds/mock data
- [ ] Implementar clientes
- [ ] Implementar catalogos y configuracion de precios
- [ ] Implementar calculadora rapida
- [ ] Implementar presupuestos + items + PDF
- [ ] Implementar conversion a orden de trabajo
- [ ] Implementar pagos, seña y saldo
- [ ] Implementar caja
- [ ] Implementar stock simple
- [ ] Implementar agenda
- [ ] Implementar alertas
- [ ] Implementar historial por cliente
- [ ] Implementar dashboard
- [ ] Ejecutar build
- [ ] Ejecutar lint
- [ ] Ejecutar typecheck
- [ ] Verificar navegacion basica
- [ ] Verificar flujo principal completo

## Propuesta de implementacion por etapas
1. Base del repo y herramientas.
2. Entidades compartidas, enums y validaciones base.
3. Modulo clientes.
4. Modulo configuracion de precios y catalogos.
5. Presupuestos y calculadora.
6. PDF y cambio de estado a aprobado.
7. Orden de trabajo derivada.
8. Pagos y caja.
9. Stock y agenda.
10. Dashboard, historial y alertas.

## Arquitectura propuesta
- Estructura simple tipo monorepo liviano:
  - `apps/web`
  - `apps/api`
  - `packages/shared`
- `apps/web`: React, Vite, TypeScript, Tailwind, router, modulos por feature, componentes UI, hooks y servicios HTTP.
- `apps/api`: Express, TypeScript, rutas por modulo, servicios de aplicacion, repositorios y acceso a PostgreSQL/Supabase.
- `packages/shared`: tipos de dominio compartidos, enums, esquemas de validacion y utilidades puras de calculo que deban vivir en una sola fuente de verdad.
- Acceso a datos con `Drizzle ORM`, migraciones con `drizzle-kit` y driver `postgres`.

## Estructura de carpetas sugerida
```text
apps/
  web/
    src/
      app/
      components/
      features/
        clients/
        quotes/
        calculator/
        work-orders/
        stock/
        cash/
        schedule/
        dashboard/
        settings/
      lib/
      routes/
      types/
  api/
    src/
      app/
      modules/
        clients/
        quotes/
        work-orders/
        stock/
        cash/
        payments/
        schedule/
        templates/
        settings/
      db/
      lib/
      types/
packages/
  shared/
    src/
      domain/
      enums/
      schemas/
      utils/
```

## Entidades y relaciones propuestas
- `clients`: ficha base del cliente.
- `quotes`: cabecera del presupuesto.
- `quote_items`: items del presupuesto con medidas, vidrio, cantidad, extras y montos.
- `work_orders`: cabecera operativa derivada de presupuesto aprobado.
- `work_order_items`: detalle operativo si se necesita separar items de produccion.
- `glass_types`: tipos de vidrio configurables.
- `service_extras`: extras configurables, por ejemplo canteado o perforaciones.
- `stock_sheets`: stock simple de hojas enteras.
- `stock_movements`: trazabilidad de ingresos, uso, rotura y ajustes.
- `payments`: señas, pagos parciales y pagos finales.
- `cash_movements`: ingresos y egresos de caja.
- `schedule_entries`: entregas y colocaciones.
- `templates`: trabajos frecuentes reutilizables.

## Decisiones de modelado propuestas
- `quotes` y `work_orders` deben coexistir: uno representa compromiso comercial y otro ejecucion operativa.
- `quote_items` debe guardar snapshot de descripcion y montos para mantener trazabilidad.
- `payments` modela el acto de cobro; `cash_movements` modela el impacto en caja.
- `stock_movements` no debe borrarse; las correcciones se hacen por ajuste compensatorio.
- `internal_notes` debe existir donde haga falta, separado de cualquier `notes` visible al cliente.

## Riesgos tecnicos a vigilar desde el arranque
- Repetir enums y validaciones entre frontend, backend y DB.
- Acoplar demasiado el PDF al frontend.
- Mezclar configuracion de precios con logica de cotizacion ad hoc.
- Crear pantallas densas que ralenticen al usuario de mostrador.
- Perder trazabilidad entre presupuesto, orden, pago y caja.
