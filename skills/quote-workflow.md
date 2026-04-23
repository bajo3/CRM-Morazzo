# Skill: quote-workflow

## Objetivo
Implementar o refinar el flujo principal de presupuesto de punta a punta.

## Alcance
- Crear presupuesto
- Agregar multiples items
- Calcular subtotal y total
- Manejar estados
- Generar PDF
- Convertir aprobado en orden de trabajo

## Inputs esperados
- Modelo de `quotes`
- Modelo de `quote_items`
- Reglas de calculo
- Reglas de estados
- Datos visibles al cliente y datos internos

## Pasos
1. Revisar enums y transiciones de estados.
2. Separar datos del cliente, detalle, montos y notas internas.
3. Centralizar calculo de items y totales.
4. Garantizar que el PDF use la misma fuente de verdad de montos.
5. Bloquear salida de observaciones internas en PDF.
6. Permitir aprobacion y derivacion a orden de trabajo sin duplicar logica innecesaria.
7. Verificar saldo, pagos asociados y trazabilidad.

## Reglas
- No duplicar formulas entre UI, backend y PDF sin una utilidad compartida.
- No mezclar estado comercial y estado productivo sin criterio.
- El PDF debe ser claro, prolijo y simple de mantener.

## Output esperado
- Flujo consistente de presupuesto
- Calculo confiable
- PDF correcto
- Conversion ordenada a orden de trabajo

