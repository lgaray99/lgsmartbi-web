-- Ejecutar tras modelo-postgresql.sql en una base LOCAL de demostración.
SELECT COUNT(*) AS lineas, COUNT(DISTINCT documento) AS documentos,
       SUM(ventas_pyg) AS ventas_pyg, SUM(costos_pyg) AS costos_pyg,
       SUM(ventas_pyg-costos_pyg) AS margen_pyg,
       SUM(ventas_pyg-costos_pyg)::numeric / NULLIF(SUM(ventas_pyg),0) AS margen_porcentual,
       SUM(ventas_pyg)::numeric / NULLIF(COUNT(DISTINCT documento),0) AS ticket_promedio
FROM demo_comercial.ventas;

SELECT s.nombre, SUM(v.ventas_pyg) AS ventas_pyg,
       SUM(v.costos_pyg) AS costos_pyg, SUM(v.ventas_pyg-v.costos_pyg) AS margen_pyg,
       SUM(v.cantidad) AS cantidad, COUNT(DISTINCT v.documento) AS documentos
FROM demo_comercial.ventas v
JOIN demo_comercial.sucursales s ON s.id=v.sucursal_id
GROUP BY s.nombre ORDER BY s.nombre;

SELECT date_trunc('month',v.fecha)::date AS mes, p.categoria,
       SUM(v.ventas_pyg) AS ventas_pyg, SUM(v.costos_pyg) AS costos_pyg
FROM demo_comercial.ventas v
JOIN demo_comercial.productos p ON p.id=v.producto_id
WHERE v.fecha BETWEEN DATE '2026-02-01' AND DATE '2026-04-30'
GROUP BY date_trunc('month',v.fecha)::date,p.categoria ORDER BY mes,p.categoria;
