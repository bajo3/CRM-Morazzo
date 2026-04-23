# AGENTS.md

## Objetivo del proyecto
Construir una web app simple, prolija, robusta y mantenible para una vidrieria. El sistema debe ayudar a vender mejor, presupuestar rapido, controlar trabajos, llevar stock simple de hojas de vidrio, controlar caja y organizar entregas o colocaciones, sin convertirse en un ERP industrial.

## Stack
- Frontend: React + Vite + TypeScript
- UI: Tailwind CSS
- Backend: Node.js + Express + TypeScript
- Base de datos: PostgreSQL / Supabase
- Acceso a datos: Drizzle ORM + postgres-js
- PDFs: presupuesto en PDF prolijo

## Estado actual
- El workspace esta vacio al inicio de esta fase.
- No hay estructura de app, repo Git ni codigo previo para reutilizar todavia.
- Antes de escribir features, debe completarse la documentacion base y las skills operativas.

## Reglas de implementacion
- Priorizar MVP funcional, estable y mantenible.
- TypeScript estricto en frontend y backend.
- Arquitectura limpia y modular, sin sobreingenieria.
- Validar inputs en frontend y backend.
- Evitar componentes gigantes, servicios gigantes y archivos con multiples responsabilidades.
- No agregar librerias innecesarias.
- No implementar logica industrial compleja.
- No desarrollar features fuera de alcance.
- Mantener nombres claros, consistentes y orientados al dominio.
- Separar dominio, aplicacion, infraestructura y UI cuando aporte claridad real.
- Preferir composicion sobre abstracciones genericas tempranas.

## Reglas de UI
- Diseno sobrio, profesional y claro.
- Desktop first con mobile razonable.
- Navegacion simple, con foco en operacion diaria de mostrador.
- Jerarquia visual fuerte para estados, totales, vencimientos y alertas.
- Formularios rapidos y directos.
- Tablas legibles, filtros simples y acciones visibles.
- Observaciones internas nunca deben aparecer en PDFs del cliente.

## Definicion de Done
Una tarea se considera terminada cuando:
- cumple el alcance pedido sin agregar features extra
- tiene tipos correctos y sin `any` innecesario
- tiene validacion minima en frontend y backend
- respeta las reglas de UI y DB del proyecto
- contempla estados y errores previsibles
- tiene navegacion basica verificada
- pasa `build`, `lint` y `typecheck`
- no deja imports muertos ni codigo huérfano

## Comandos esperados de run/build/lint/typecheck
Estos comandos deben quedar operativos cuando se arme la base del proyecto:

### Frontend
- `npm run dev`
- `npm run build`
- `npm run lint`
- `npm run typecheck`

### Backend
- `npm run dev`
- `npm run build`
- `npm run lint`
- `npm run typecheck`

### Workspace raiz
- `npm run build`
- `npm run lint`
- `npm run typecheck`

## Politica de no sobreingenieria
- No introducir CQRS, event sourcing, microservicios, colas ni capas ceremoniales sin una necesidad real del MVP.
- No modelar stock por recortes ni optimizacion de corte en esta etapa.
- No crear motores de reglas avanzados para precios o estados.
- No agregar auth compleja, permisos avanzados ni multi-sucursal.
- Cuando haya ambigüedad, elegir la solucion mas simple y robusta.

## Flujo principal del negocio
1. Se crea o selecciona un cliente.
2. Se arma un presupuesto con uno o varios items.
3. Se calcula el precio rapido segun vidrio, medidas, cantidad y extras.
4. Se genera y comparte PDF del presupuesto.
5. Si el presupuesto se aprueba, se convierte en orden de trabajo.
6. Se registra seña, saldo pendiente y medio de pago.
7. Se descuenta o controla stock simple si aplica.
8. Se agenda entrega o colocacion.
9. Se registra cobro final y movimientos de caja.
10. Todo queda reflejado en historial del cliente y dashboard.

## Orden sugerido de trabajo
1. FASE 0: documentacion base y skills
2. FASE 1: definicion de arquitectura, entidades y estructura de carpetas
3. Base tecnica: monorepo simple o estructura `apps/web`, `apps/api`, `packages/shared`
4. Infraestructura minima: Tailwind, Express, acceso a DB, migraciones y seeds
5. Modulo clientes
6. Configuracion basica de precios y catalogos
7. Presupuestos + items + PDF
8. Calculadora rapida
9. Conversion a orden de trabajo
10. Pagos, seña/saldo y caja
11. Stock simple
12. Agenda, alertas y dashboard
13. Pulido, validaciones finales y datos mock/seed

## Criterios arquitectonicos
- Mantener un dominio simple y explicito.
- Compartir tipos y esquemas solo donde tenga valor real.
- Diseñar API por modulos: clients, quotes, work-orders, stock, cash, schedule, templates, config.
- Mantener componentes de pantalla pequeños y apoyados en hooks/servicios.
- Centralizar enums y reglas de estados para evitar duplicacion.
- Usar `packages/shared` como fuente unica para tipos, enums, validaciones y calculos puros.
