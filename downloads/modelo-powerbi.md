# DemoComercial S.A. — reproducción en Power BI Desktop

Empresa y datos completamente ficticios. Dashboard web ejecutado con JavaScript; **no existe un PBIX/PBIP validado**. Estos archivos son insumos para reproducir el modelo, no un informe Power BI terminado. DAX y M no ejecutados en Desktop en esta revisión.

1. Descargar en una misma carpeta `ventas.csv`, `productos.csv`, `clientes.csv`, `sucursales.csv` y `fechas.csv` desde LG-006. Archivos UTF-8 con BOM y separador `;`.
2. Importar con Power Query y nombrar las consultas **Ventas, Producto, Cliente, Sucursal, Fecha**. Elegir modo Import. Desactivar detección automática de tipos hasta asignarlos explícitamente. IDs y documento como Texto (preservan ceros); fecha como Fecha; cantidad e importes PYG como Número entero. El calendario cubre todos los días de 2026.
3. En Power Query puede crearse una consulta en blanco **CargarCsv** con `cargar-csv.pq` y un parámetro Texto **CarpetaDemo**, elegido localmente. Ejemplo de consulta Ventas:

```powerquery
let
    Datos = CargarCsv(CarpetaDemo, "ventas.csv", {
        {"id", type text}, {"documento", type text}, {"fecha", type date},
        {"sucursal_id", type text}, {"cliente_id", type text}, {"producto_id", type text},
        {"cantidad", Int64.Type}, {"precio_pyg", Int64.Type},
        {"costo_unitario_pyg", Int64.Type}, {"ventas_pyg", Int64.Type}, {"costos_pyg", Int64.Type}})
in
    Datos
```

4. Crear relaciones activas 1:* con filtro unidireccional: Fecha[fecha] → Ventas[fecha], Producto[id] → Ventas[producto_id], Cliente[id] → Ventas[cliente_id], Sucursal[id] → Ventas[sucursal_id]. IDs únicos en las dimensiones, sin nulos ni claves huérfanas. La categoría es atributo de Producto (sin dimensión extra que cree un copo de nieve).
5. Marcar Fecha como tabla de fechas por su columna fecha. Desactivar fecha/hora automática. Ordenar mes por su número. Grano del hecho: línea identificada por id; un documento tiene dos líneas. Ocultar claves técnicas y columnas monetarias base; mostrar medidas explícitas.
6. Crear individualmente las medidas de `medidas.dax`. Margen = ventas − costos; porcentaje = margen / ventas; ticket = ventas / documentos distintos bajo el contexto filtrado. Ratios sin denominador devuelven BLANK. Cantidades de distintos productos son unidades comerciales, no magnitudes físicas convertibles.
7. Crear tarjetas para ventas, costos, margen, margen %, cantidad, documentos, ticket y clientes; segmentadores para Fecha, Sucursal, Producto[categoria], Producto[nombre] y Cliente; gráfico mensual con Fecha y tabla de sucursales. Comparar con LG-007 usando el mismo rango.

El hecho CSV contiene los 84 registros aceptados del ETL: se excluyeron anulados y se conservaron sus rechazos en LG-005. Los CSV son tablas simples, sin totales, fórmulas ni formatos. El precio y el costo son valores unitarios históricos de cada línea, no se recalculan usando precios actuales del producto. No incluye impuestos, descuentos ni devoluciones.

## Actualización y producción

La web usa un dataset versionado determinista; recargar restablece el estado en memoria. LG-005 demuestra upserts incrementales por ID y versión UTC. El dataset base de BI/DW permanece estable; exportar el ETL permite analizar otro escenario sin alterar el ejemplo compartido.

Una solución productiva requiere fuentes autorizadas, staging persistente, claves de negocio, tratamiento de eliminaciones y anulaciones, auditoría, control de acceso/RLS y reconciliación de totales. En Import se programaría actualización en Power BI Service y gateway para fuentes locales. La actualización incremental real requeriría RangeStart/RangeEnd, query folding cuando corresponda, retención y política de refresco; no está configurada aquí.

Referencias: [modelo estrella](https://learn.microsoft.com/en-us/power-bi/guidance/star-schema), [DIVIDE](https://learn.microsoft.com/en-us/dax/divide-function-dax). No se accede a servicios de Power BI desde la demo.
