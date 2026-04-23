# Skill: pre-commit-check

## Objetivo
Verificar que el cambio quede estable antes de cerrar una etapa o generar un commit.

## Inputs esperados
- Contexto del cambio
- Comandos disponibles
- Alcance de modulos tocados

## Pasos
1. Ejecutar `build`.
2. Ejecutar `lint`.
3. Ejecutar `typecheck`.
4. Verificar datos seed o mock relevantes.
5. Probar navegacion basica del flujo tocado.
6. Confirmar que no haya imports muertos ni errores obvios de UI.

## Reglas
- Si un check falla, documentar causa real y no maquillarla.
- No cerrar tarea como lista con errores de compilacion.
- Priorizar pruebas del flujo principal del negocio.

## Output esperado
- Lista corta de checks ejecutados
- Resultado de cada check
- Riesgos o pendientes reales
