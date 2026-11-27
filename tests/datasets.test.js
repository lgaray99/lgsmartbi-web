const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const E=require('../assets/js/commercial-engine.js'),CSV=require('../assets/js/demo-engine.js');
const read=name=>CSV.validateCsv(CSV.parseCsv(fs.readFileSync(path.join(__dirname,'../downloads/'+name+'.csv'),'utf8'),';'));
test('Datasets descargables: filas, campos, claves y tipos compatibles con los hechos ejecutados',()=>{
    const rows=read('ventas');assert.equal(rows.length,85);assert.equal(rows[0].length,11);
    assert.deepEqual(rows[0],['id','documento','fecha','sucursal_id','cliente_id','producto_id','cantidad','precio_pyg','costo_unitario_pyg','ventas_pyg','costos_pyg']);
    assert.equal(new Set(rows.slice(1).map(r=>r[0])).size,84);
    for(const [file,index,count] of [['productos',5,6],['clientes',4,6],['sucursales',3,3],['fechas',2,365]]) {
        const dim=read(file);assert.equal(dim.length,count+1);const keys=new Set(dim.slice(1).map(r=>r[0]));
        for(const r of rows.slice(1))assert.ok(keys.has(r[index]));
    }
    for(const r of rows.slice(1)) {
        E.date(r[2]);for(const n of r.slice(6))assert.ok(/^\d+$/.test(n));
        assert.equal(Number(r[6])*Number(r[7]),Number(r[9]));assert.equal(Number(r[6])*Number(r[8]),Number(r[10]));
    }
    assert.equal(rows.slice(1).reduce((s,r)=>s+Number(r[9]),0),E.analyze().sales);
});
test('Origen JSON descargable coincide con el dataset determinista y conserva anomalías',()=>{
    const raw=JSON.parse(fs.readFileSync(path.join(__dirname,'../downloads/origen-ventas.json'),'utf8'));
    assert.deepEqual(raw,E.data.raw);assert.equal(raw.length,101);assert.equal(E.transform(raw).rejected.length,17);
});
