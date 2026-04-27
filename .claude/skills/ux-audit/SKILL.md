# Skill: ux-audit

## Objetivo
Auditar una pantalla o flujo del CRM con criterio operativo real para una vidriería: menos clicks, estados visibles, acciones principales obvias.

## Cuándo usarla
- Antes de aceptar que una pantalla está "lista".
- Cuando un flujo se siente lento, confuso o requiere demasiados pasos.
- Cuando el dashboard no ayuda a tomar decisiones rápido.
- Antes de refactorizar UI sin tener claro qué está roto.

## Inputs esperados
- Nombre de la pantalla o flujo a auditar
- Descripción breve de lo que hace el usuario en ese flujo
- Screenshots, descripciones o código del componente si están disponibles

## Checklist de auditoría

### Clicks y navegación
- ¿Cuántos clicks necesita el usuario para completar la acción principal?
- ¿Hay pasos intermedios que no agregan valor?
- ¿La ruta de navegación es predecible?
- ¿El botón de acción principal es obvio desde el primer vistazo?

### Formularios
- ¿Los labels son visibles siempre (no solo como placeholder)?
- ¿Las validaciones aparecen cerca del campo y con mensaje claro?
- ¿Los campos numéricos muestran la unidad (m², mm, $)?
- ¿Los defaults son inteligentes o dejan al usuario adivinar?
- ¿Los bloques están organizados lógicamente (cliente → detalle → pagos → notas)?

### Estados y visibilidad
- ¿El estado del presupuesto/orden/pago es visible sin abrir el registro?
- ¿Los badges de estado son claros (no solo por color)?
- ¿Los saldos pendientes están visibles sin hacer cuentas?
- ¿El stock bajo o alertas críticas aparecen donde corresponde?

### Dashboard
- ¿El dashboard muestra lo que necesita el operador al arrancar el día?
- ¿Hay KPIs accionables (no solo decorativos)?
- ¿Se pueden ver presupuestos pendientes, órdenes activas y cobros del día de un vistazo?
- ¿Las alertas operativas son visibles y tienen acción directa?

### Flujo de presupuesto
- ¿Se puede crear un presupuesto nuevo en menos de 3 clicks desde cualquier punto?
- ¿El cálculo de precio es visible en tiempo real al cargar items?
- ¿El PDF se puede generar desde la misma pantalla sin navegar?
- ¿La aprobación y conversión a orden de trabajo es un solo paso claro?

### Orden de trabajo
- ¿El operario puede ver el trabajo asignado sin ambigüedad?
- ¿El estado de la OT es actualizable desde la vista de lista o desde el detalle?
- ¿El cliente, el trabajo y la fecha de entrega son visibles sin abrir el registro?

### Pagos y saldos
- ¿El saldo pendiente de un cliente es visible en su ficha y en la OT?
- ¿Registrar un pago requiere pocos pasos?
- ¿El impacto en caja es automático o tiene un paso explícito claro?

### Agenda
- ¿Los eventos del día son visibles sin filtrar manualmente?
- ¿Reagendar es posible sin perder el historial?
- ¿La vista de agenda muestra cliente, trabajo y estado de un vistazo?

### Stock
- ¿El stock disponible de cada tipo de vidrio es visible rápido?
- ¿El stock bajo tiene alerta visual?
- ¿Registrar una entrada o salida de stock es simple y directa?

## Reglas
- No auditar en abstracto: siempre referir a pantallas reales del CRM.
- No proponer rediseño completo si el problema es puntual.
- No agregar campos ni pantallas nuevas si el problema es de organización.
- Priorizar los flujos del smoke flow obligatorio: cliente → presupuesto → OT → pago → caja.

## Output esperado
- Lista de problemas detectados por pantalla/flujo
- Severidad de cada problema: crítico / moderado / menor
- Acción recomendada concreta (no genérica)
- Próximos pasos priorizados para mejorar UX sin agrandar el sistema
