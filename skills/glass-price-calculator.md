# Skill: glass-price-calculator

## Objetivo
Construir la calculadora rapida de precios de vidrio para uso de mostrador.

## Inputs esperados
- Tipo de vidrio
- Espesor
- Ancho
- Alto
- Cantidad
- Extras
- Instalacion si/no
- Configuracion de precios base

## Formula base
- `m2 = (ancho * alto) / 1000000`
- `m2_total = m2 * cantidad`
- `subtotal = precio_base * m2_total`
- `total_final = subtotal + extras + instalacion + flete`

## Pasos
1. Validar medidas y cantidad.
2. Resolver precio base segun vidrio y espesor.
3. Calcular area por pieza y area total.
4. Aplicar extras de forma explicita y trazable.
5. Mostrar desglose simple.
6. Permitir reutilizar el resultado dentro de un item de presupuesto.

## Reglas
- No convertir esta calculadora en un motor industrial.
- Evitar reglas ocultas o magicas.
- Todas las unidades deben estar claras.
- Mantener formulas compartibles entre calculadora y presupuesto.

## Output esperado
- Calculadora clara y rapida
- Desglose entendible
- Resultado reutilizable en presupuesto

