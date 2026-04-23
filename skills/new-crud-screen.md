# Skill: new-crud-screen

## Objetivo
Crear una pantalla CRUD simple, consistente y mantenible dentro del MVP.

## Cuándo usarla
- Cuando se agrega un modulo nuevo con listado + alta/edicion.
- Cuando se necesita mantener consistencia visual y tecnica con el resto del sistema.

## Inputs esperados
- Nombre de la entidad
- Campos principales
- Estados si aplica
- Acciones requeridas
- Regla de negocio minima

## Pasos
1. Revisar si la entidad ya existe en dominio, API y DB.
2. Confirmar columnas reales y validaciones obligatorias.
3. Crear pantalla con header, tabla/listado y accion principal.
4. Crear formulario desacoplado del listado.
5. Reusar badges, inputs y patrones visuales definidos.
6. Validar en frontend y backend.
7. Agregar estados vacios, loading y error.
8. Probar alta, edicion y visualizacion basica.

## Reglas
- No meter listado, formulario y logica de fetch en un solo componente gigante.
- Evitar modales si un panel o ruta dedicada es mas claro.
- No inventar filtros avanzados sin necesidad.
- Si hay notas internas, mantenerlas separadas de cualquier salida al cliente.

## Output esperado
- Pantalla CRUD consistente
- Formulario validado
- Listado legible
- Integracion con API y DB
- Navegacion basica verificada

