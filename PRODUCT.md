# PRODUCT.md

## Problema que resuelve el sistema
Una vidrieria pequena o mediana suele trabajar con presupuestos armados a mano, calculos dispersos, seguimiento informal de trabajos, stock simple en papel o memoria, y caja poco ordenada. Eso genera demoras, errores de precio, olvidos de cobro, entregas descoordinadas y baja visibilidad del negocio diario.

Este sistema busca resolver eso con una aplicacion operativa simple: presupuestar rapido, convertir ventas en trabajo, registrar cobros, controlar stock basico y ordenar agenda y caja.

## Quien lo usa
- Dueno o encargado de la vidrieria
- Personal administrativo o de mostrador
- Operario o coordinador que consulta trabajos y entregas

## Flujo real del negocio
1. Entra una consulta de cliente.
2. Se registra o actualiza ficha del cliente.
3. Se arma un presupuesto con items y extras.
4. Se calcula precio segun vidrio, medidas, cantidad e instalacion.
5. Se genera PDF prolijo para enviar al cliente.
6. Si el cliente aprueba, se crea la orden de trabajo.
7. Se registra seña y queda saldo pendiente.
8. Se prepara el trabajo y, si aplica, se organiza entrega o colocacion.
9. Se cobra saldo y se impacta en caja.
10. El historial del cliente queda consolidado.

## Alcance del MVP
- Gestion de clientes
- Presupuestos con multiples items
- Calculadora rapida de precios
- PDF de presupuesto
- Ordenes de trabajo derivadas desde presupuestos aprobados
- Registro de seña, saldo y pagos
- Caja con ingresos y egresos simples
- Stock simple de hojas
- Agenda de entregas y colocaciones
- Historial por cliente
- Plantillas de trabajos frecuentes
- Alertas simples
- Dashboard operativo

## Fuera de alcance por ahora
- Auth compleja
- Permisos avanzados
- Multiples sucursales
- Stock por recortes
- Optimizacion de cortes
- Facturacion fiscal
- Multi-moneda
- Reporteria financiera avanzada
- Integraciones externas complejas

## Principios de producto
- Menos clicks, mas claridad.
- La operacion diaria manda sobre la sofisticacion.
- Todo estado importante debe ser visible.
- El sistema tiene que ayudar a vender y cobrar, no solo a registrar.
- Las observaciones internas son privadas.
- El dashboard debe priorizar accion, no decoracion.

## Criterio de exito del MVP
El MVP es exitoso si permite:
- crear un cliente rapido
- emitir un presupuesto claro con PDF
- aprobarlo y convertirlo en orden de trabajo
- registrar pagos y ver saldo pendiente
- llevar una caja simple
- consultar stock basico y agenda
- detectar alertas operativas obvias

