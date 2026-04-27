# Skill: code-review

## Objetivo
Revisar cambios de código después de implementar una feature o fix, verificando correctitud técnica, consistencia con el stack y ausencia de regresiones.

## Cuándo usarla
- Después de implementar cualquier feature del CRM antes de cerrar la tarea.
- Cuando un cambio tocó múltiples módulos o capas.
- Antes de hacer commit en flujos críticos: presupuesto, pagos, caja, stock.
- Como complemento del skill pre-commit-check.

## Inputs esperados
- Descripción del cambio implementado
- Archivos o módulos tocados
- Feature o bug que resuelve

## Checklist de revisión

### TypeScript
- ¿Los tipos son correctos y no usan `any` innecesariamente?
- ¿Los tipos del dominio viven en `packages/shared` y no están duplicados?
- ¿Las interfaces de request/response están tipadas en ambos lados?
- ¿Los enums usados corresponden a los definidos en `packages/shared`?

### Rutas y servicios API
- ¿Las rutas nuevas siguen la convención del proyecto?
- ¿Los handlers validan inputs en el servidor (no solo en el cliente)?
- ¿Los errores tienen respuesta con status HTTP correcto y mensaje claro?
- ¿Los endpoints nuevos están protegidos si corresponde?

### Componentes React
- ¿El componente tiene una sola responsabilidad clara?
- ¿El estado local es mínimo y no duplica lo que viene del servidor?
- ¿El loading, el error y el estado vacío están manejados?
- ¿Los formularios usan el patrón establecido (FormField, validaciones cerca del campo)?
- ¿Los badges de estado usan `StatusBadge` con el color semántico correcto?

### Contratos frontend/backend
- ¿El frontend consume exactamente lo que el backend retorna (sin asumir campos extra)?
- ¿Los montos se manejan en centavos en persistencia y se formatean solo para mostrar?
- ¿Las medidas se guardan en mm y se convierten solo para display?
- ¿Los cálculos de precio usan las funciones de `packages/shared/src/calculations`?

### Migraciones y DB
- ¿La migración es idempotente y reproducible?
- ¿Los nombres de tablas y columnas siguen las convenciones de DB_RULES.md?
- ¿Los enums nuevos están centralizados y no duplicados?
- ¿Los IDs usan UUID v7?
- ¿Las foreign keys están declaradas correctamente?
- ¿Los timestamps `created_at` y `updated_at` están presentes en tablas operativas?

### Lógica de negocio
- ¿Las transiciones de estado respetan las definidas en TECH_DECISIONS.md?
- ¿Los pagos quedan con referencia trazable al origen (presupuesto u OT)?
- ¿Las observaciones internas están separadas de los datos del cliente?
- ¿El PDF no incluye campos que son internos?
- ¿El smoke flow sigue funcionando después del cambio?

### Calidad de código
- ¿Hay lógica duplicada que debería estar en un helper compartido?
- ¿Los nombres de variables y funciones son claros sin necesitar comentario?
- ¿No hay imports muertos ni archivos sin usar?
- ¿El cambio no introdujo console.log de debug sin remover?

### Build y checks
- ¿El build compila sin errores (`npm run build`)?
- ¿El typecheck pasa (`npm run typecheck`)?
- ¿El lint no reporta errores nuevos (`npm run lint`)?
- ¿El flujo principal del módulo tocado funciona en la UI?

## Reglas
- No aprobar si hay error de compilación o typecheck roto.
- No ignorar montos en float o medidas en unidades incorrectas.
- No cerrar como listo si el smoke flow está roto.
- No pedir cambios de estilo o refactor que no afecten correctitud.
- Si el cambio tocó caja o pagos, verificar trazabilidad obligatoriamente.

## Output esperado
- Lista de problemas encontrados con archivo y línea si aplica
- Clasificación: bloqueante / advertencia / sugerencia
- Acciones concretas para resolver cada problema bloqueante
- Confirmación de checks ejecutados y su resultado
