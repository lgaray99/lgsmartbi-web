const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {PGlite}=require('@electric-sql/pglite');
const E=require('../assets/js/commercial-engine.js');
test('PostgreSQL WASM: SQL reproducible, relaciones y agregados contra JavaScript',async()=>{
    const db=await PGlite.create();
    try {
        const script=fs.readFileSync(path.join(__dirname,'../downloads/modelo-postgresql.sql'),'utf8');
        await db.exec(script);await db.exec(script); // Repetición sin duplicar.
        const results=await db.exec(fs.readFileSync(path.join(__dirname,'../downloads/consultas.sql'),'utf8'));
        const totals=results[0].rows[0];
        assert.equal(Number(totals.lineas),84);assert.equal(Number(totals.documentos),42);
        assert.equal(Number(totals.ventas_pyg),5017000);assert.equal(Number(totals.costos_pyg),2993000);assert.equal(Number(totals.margen_pyg),2024000);
        for(const row of results[1].rows) {
            const branch=E.data.branches.find(x=>x.name===row.nombre),a=E.analyze({branchId:branch.id});
            assert.equal(Number(row.ventas_pyg),a.sales);assert.equal(Number(row.costos_pyg),a.costs);
        }
        await assert.rejects(db.query("INSERT INTO demo_comercial.ventas(id,documento,fecha,sucursal_id,cliente_id,producto_id,cantidad,precio_pyg,costo_unitario_pyg) VALUES('ERROR','ERROR','2026-01-01','S999','C001','P001',1,10,6)"),/foreign key/);
        const count=await db.query('SELECT COUNT(*) AS n FROM demo_comercial.ventas');assert.equal(Number(count.rows[0].n),84);
    } finally {await db.close();}
});
