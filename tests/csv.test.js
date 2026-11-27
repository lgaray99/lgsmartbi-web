const {test}=require('node:test'),assert=require('node:assert/strict'),E=require('../assets/js/demo-engine.js');
test('CSV: por defecto conserva códigos, vacíos, fórmulas y todos los registros',()=>{
    const rows=[['codigo','texto'],['001',''],['002','=1+1'],['002','=1+1']];
    const before=JSON.stringify(rows),r=E.transformCsv(rows);
    assert.deepEqual(r.rows,rows);assert.equal(r.stats.outputRows,3);assert.equal(JSON.stringify(rows),before);
});
test('CSV: recorte, deduplicación y cambio de texto por columna son explícitos',()=>{
    const rows=[[' codigo ','producto'],['001',' chipá '],['001','CHIPÁ'],['002','Pan']];
    const r=E.transformCsv(rows,{trim:true,dedupe:true,column:1,letterCase:'upper'});
    assert.deepEqual(r.rows,[['codigo','producto'],['001','CHIPÁ'],['002','PAN']]);assert.equal(r.stats.duplicates,1);
});
test('CSV: filas vacías opcionales, errores de formato y encabezados tras normalizar',()=>{
    const rows=[['a','b'],['',''],[''],['001','']];
    assert.throws(()=>E.transformCsv(rows));
    const r=E.transformCsv(rows,{removeEmpty:true});assert.equal(r.stats.empty,2);assert.equal(r.rows[1][0],'001');
    assert.throws(()=>E.transformCsv([['a',' a ']],{trim:true}));assert.throws(()=>E.transformCsv([]));
    assert.throws(()=>E.transformCsv([[]]));assert.throws(()=>E.validateCsv([null]));
    assert.throws(()=>E.transformCsv([['a'],['1']],{column:2}));assert.throws(()=>E.transformCsv([['a'],['1']],{letterCase:'invalid'}));
});
test('CSV: campos multilínea y delimitadores sobreviven transformación y exportación',()=>{
    const rows=E.parseCsv('codigo,detalle\r\n001,"dos\nlíneas; y comillas ""sí"""\r\n',',');
    const transformed=E.transformCsv(rows).rows;
    assert.deepEqual(E.parseCsv(E.serializeCsv(transformed,';'),';'),rows);
});
