-- Solo para base LOCAL de demostración. No contiene conexiones ni credenciales.
CREATE SCHEMA IF NOT EXISTS demo_comercial;
CREATE TABLE IF NOT EXISTS demo_comercial.productos (
    id text PRIMARY KEY, nombre text NOT NULL, categoria text NOT NULL, unidad text NOT NULL
);
CREATE TABLE IF NOT EXISTS demo_comercial.clientes (id text PRIMARY KEY, nombre text NOT NULL);
CREATE TABLE IF NOT EXISTS demo_comercial.sucursales (id text PRIMARY KEY, nombre text NOT NULL);
CREATE TABLE IF NOT EXISTS demo_comercial.fechas (
    fecha date PRIMARY KEY, anio integer NOT NULL, mes integer NOT NULL CHECK (mes BETWEEN 1 AND 12),
    trimestre integer NOT NULL CHECK (trimestre BETWEEN 1 AND 4)
);
CREATE TABLE IF NOT EXISTS demo_comercial.ventas (
    id text PRIMARY KEY, documento text NOT NULL,
    fecha date NOT NULL REFERENCES demo_comercial.fechas(fecha),
    sucursal_id text NOT NULL REFERENCES demo_comercial.sucursales(id),
    cliente_id text NOT NULL REFERENCES demo_comercial.clientes(id),
    producto_id text NOT NULL REFERENCES demo_comercial.productos(id),
    cantidad bigint NOT NULL CHECK (cantidad BETWEEN 1 AND 1000000),
    precio_pyg bigint NOT NULL CHECK (precio_pyg BETWEEN 0 AND 1000000000),
    costo_unitario_pyg bigint NOT NULL CHECK (costo_unitario_pyg BETWEEN 0 AND 1000000000),
    ventas_pyg bigint GENERATED ALWAYS AS (cantidad * precio_pyg) STORED,
    costos_pyg bigint GENERATED ALWAYS AS (cantidad * costo_unitario_pyg) STORED
);
CREATE INDEX IF NOT EXISTS ventas_fecha_sucursal ON demo_comercial.ventas(fecha, sucursal_id);
