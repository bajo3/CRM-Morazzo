# Skill: cash-movement-feature

## Objetivo
Implementar movimientos de caja simples, trazables y utiles para operacion diaria.

## Inputs esperados
- Tipo de movimiento
- Categoria
- Monto
- Fecha
- Medio de pago
- Referencia opcional a cliente, presupuesto, orden o pago

## Pasos
1. Definir si el movimiento es ingreso o egreso.
2. Registrar monto en centavos.
3. Guardar categoria y referencia de origen si existe.
4. Asegurar impacto en resumen diario, semanal y mensual.
5. Mostrar ultimos movimientos y saldo actual.
6. Validar anulaciones o ajustes sin borrar historial.

## Reglas
- Nunca borrar movimientos financieros reales.
- Evitar categorias excesivas en el MVP.
- Mantener trazabilidad con pagos, señas y cobros finales.

## Output esperado
- Registro confiable de caja
- Resumen operativo util
- Historial trazable

