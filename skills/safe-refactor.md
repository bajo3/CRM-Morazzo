# Skill: safe-refactor

## Objetivo
Refactorizar sin romper flujos existentes ni agregar complejidad gratuita.

## Inputs esperados
- Archivo o modulo a refactorizar
- Problema actual
- Resultado esperado
- Restricciones de compatibilidad

## Pasos
1. Entender el comportamiento actual antes de tocar estructura.
2. Detectar responsabilidades mezcladas.
3. Extraer piezas pequeñas y nombradas por dominio.
4. Mantener interfaces estables cuando sea posible.
5. Verificar tipos, imports y flujos afectados.
6. Ejecutar checks despues del cambio.

## Reglas
- No refactorizar por gusto.
- No mezclar refactor con feature grande salvo que destrabe claramente.
- Si el archivo ya esta sucio por cambios de otro, trabajar con cuidado y no revertir ajeno.

## Output esperado
- Codigo mas claro
- Menor acoplamiento
- Sin regresiones visibles

