# Skill: product-analysis

## Objetivo
Analizar el CRM como producto real para una vidriería: qué funciona, qué sobra, qué traba el flujo diario y cómo priorizar mejoras sin agrandar el sistema.

## Cuándo usarla
- Cuando se siente que el sistema tiene mucho pero no ayuda operativamente.
- Antes de agregar una feature nueva, para validar que realmente falta.
- Cuando el flujo de trabajo del negocio no encaja bien con lo que hace el sistema.
- Para decidir qué cortar, simplificar o posponer.

## Inputs esperados
- Módulo, pantalla o flujo a analizar
- Descripción del problema o fricción que se nota
- Contexto del uso real: quién lo usa, en qué momento, con qué frecuencia

## Preguntas de análisis

### Pantallas y módulos
- ¿Esta pantalla resuelve un problema real del negocio de vidriería?
- ¿Se usa en el flujo diario o es consulta ocasional?
- ¿Duplica información disponible en otro módulo?
- ¿Estaría el sistema más operativo si esta pantalla no existiera?

### Flujo de trabajo
- ¿El flujo del sistema refleja cómo realmente opera la vidriería?
- ¿Hay pasos en el sistema que no existen en el negocio real?
- ¿Hay pasos del negocio real que el sistema no cubre o complica?
- ¿El flujo presupuesto → OT → pago → caja funciona de punta a punta sin fricciones?

### Información crítica
- ¿Qué datos necesita ver el operador para tomar decisiones en el día?
- ¿Esos datos están disponibles con claridad?
- ¿Hay información que el sistema registra pero nadie consulta?
- ¿Hay información que todos buscan pero el sistema no la tiene o la esconde?

### Priorización
- ¿Qué proceso tiene mayor impacto en las ventas y cobros de la vidriería?
- ¿Qué falla o se tarda más en hacer actualmente?
- ¿Qué mejora libera tiempo o reduce errores reales?
- ¿Qué puede esperar sin afectar la operación diaria?

### Alcance vs complejidad
- ¿Esta mejora está dentro del alcance del MVP definido en PRODUCT.md?
- ¿Agrega complejidad de mantenimiento proporcional al valor que entrega?
- ¿Se puede resolver con una mejora pequeña en lugar de una feature nueva?
- ¿Requiere cambios en DB, API y UI o solo en UI?

## Criterio de corte
Una mejora vale la pena si cumple al menos dos de:
- Acelera el flujo de presupuestación o cobro
- Reduce errores operativos reales
- Hace visible información que el negocio ya necesita pero no ve
- Simplifica un paso sin reemplazarlo por otro más complejo

## Reglas
- No proponer features que estén explícitamente fuera de alcance en PRODUCT.md.
- No agregar módulos sin eliminar o simplificar otro si el sistema ya está grande.
- No confundir "interesante" con "necesario para la operación diaria".
- Siempre evaluar el impacto sobre el smoke flow obligatorio antes de proponer cambios.
- Las observaciones internas nunca deben filtrarse al cliente: respetar esa separación en cualquier análisis.

## Output esperado
- Diagnóstico claro del estado actual del módulo o flujo
- Lista de problemas reales ordenados por impacto
- Recomendación de qué hacer, qué simplificar y qué descartar
- Estimación de esfuerzo relativo: bajo / medio / alto
- Próximo prompt o tarea recomendada si hay acción concreta
