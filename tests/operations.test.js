const {test}=require('node:test'),assert=require('node:assert/strict'),O=require('../assets/js/operations-engine.js');
test('RPA: cola determinista, fallo transitorio recuperable y fallo permanente',()=>{
    const initial=O.rpaInitial(),done=O.rpaRun(initial,1);
    assert.deepEqual(done.tasks.map(r=>r.status),['Completado','Completado','Fallido']);
    assert.deepEqual(done.tasks.map(r=>r.attempts),[1,2,2]);assert.equal(initial.log.length,0);
    assert.deepEqual(O.rpaRun(initial,1),done);assert.deepEqual(O.rpaRun(done,1),done);
});
test('RPA: reintentos configurables y parámetros inválidos atómicos',()=>{
    assert.equal(O.rpaRun(O.rpaInitial(),0).tasks[1].status,'Fallido');
    assert.equal(O.rpaRun(O.rpaInitial(),3).tasks[2].attempts,4);
    const initial=O.rpaInitial();assert.throws(()=>O.rpaStep(initial,-1));assert.equal(initial.log.length,0);
});
test('Monitor: evento idéntico se ignora; commit tras éxito',()=>{
    let state=O.detectNext(O.monitorInitial());assert.equal(state.committed.length,0);
    state=O.processMonitor(state);assert.equal(state.committed[0].rows,84);
    state=O.detectNext(state);assert.equal(state.ignored,1);assert.equal(state.queue.length,1);
});
test('Monitor: fallo transitorio no pisa materializado y reintenta',()=>{
    let state=O.processMonitor(O.detectNext(O.monitorInitial()));state=O.detectNext(O.detectNext(state));
    state=O.processMonitor(state,1);assert.equal(state.committed[0].rows,84);assert.equal(state.queue[1].status,'Reintento');
    state=O.processMonitor(state,1);assert.equal(state.committed[0].rows,85);
});
test('Monitor: bajas y versiones obsoletas no reprocesan salidas antiguas',()=>{
    let state=O.monitorInitial();for(let i=0;i<6;i++)state=O.detectNext(state);
    assert.equal(state.queue[0].status,'Obsoleto');
    for(let i=0;i<10;i++)state=O.processMonitor(state);
    assert.equal(state.committed.some(r=>r.name==='ventas.parquet'),false);
    assert.equal(state.ignored,2);
});
test('Monitor: error permanente y evento inválido conservan estado',()=>{
    let state=O.observe(O.monitorInitial(),{name:'stock.parquet',kind:'create',signature:'S1',rows:1});state=O.processMonitor(state);
    state=O.observe(state,{name:'stock.parquet',kind:'modify',signature:'S2',rows:2,error:'corrupt'});
    state=O.processMonitor(O.processMonitor(state,1),1);assert.equal(state.committed[0].signature,'S1');assert.equal(state.queue[1].status,'Error');
    const before=JSON.stringify(state);assert.throws(()=>O.observe(state,{name:'../archivo.parquet',kind:'delete'}));assert.equal(JSON.stringify(state),before);
});
test('BOM: escenario anterior, consumo registrado y faltantes consistentes',()=>{
    const r=O.materialPlan([{productId:'P002',qty:20}]);
    assert.deepEqual(r.map(x=>x.required),[4.6,1.6,20]);assert.deepEqual(r.map(x=>x.difference),[.1,-.05,1]);assert.deepEqual(r.map(x=>x.shortage),[0,.6,5]);
});
test('BOM multinivel: expandir y agregar sin doble conteo',()=>{
    const r=O.materialPlan([{productId:'P006',qty:1}],O.bom.recipes,[]);
    assert.equal(r.find(x=>x.id==='HAR').required,.76);assert.equal(r.find(x=>x.id==='EMP').required,3);assert.equal(r.find(x=>x.id==='CAJ').required,1);
    assert.equal(r.find(x=>x.id==='QUE').recorded,null);
});
test('BOM: unidades, ciclos y componentes duplicados inválidos',()=>{
    assert.equal(O.baseQuantity('1.250','kg','kg'),1250);assert.equal(O.baseQuantity('500','ml','l'),500);
    assert.throws(()=>O.baseQuantity(1,'kg','l'));assert.throws(()=>O.baseQuantity(.5,'unidad','unidad'));
    assert.throws(()=>O.materialPlan([{productId:'HAR',qty:1}],{HAR:[{id:'QUE',quantity:1,unit:'g'}]},[]));
    assert.throws(()=>O.materialPlan([{productId:'P001',qty:0}],{P001:[{id:'P001',quantity:1,unit:'unidad'}]},[]));
    assert.throws(()=>O.materialPlan([{productId:'P001',qty:1}],{P001:[{id:'HAR',quantity:1,unit:'kg'},{id:'HAR',quantity:1,unit:'kg'}]},[]));
});
test('BOM: cantidades extremas, desconocidas y producción repetida',()=>{
    assert.throws(()=>O.materialPlan([{productId:'P002',qty:100001}]));assert.throws(()=>O.materialPlan([{productId:'P004',qty:1}]));
    assert.throws(()=>O.materialPlan([{productId:'P002',qty:1},{productId:'P002',qty:1}]));
    assert.equal(O.materialPlan([{productId:'P002',qty:0}],O.bom.recipes,[])[0].required,0);
});
test('Historial: métricas y SLA con resultados conocidos',()=>{
    const rows=[{startedAt:'2026-06-01T08:00:00Z',job:'A',status:'Completado',duration:60,attempts:1},{startedAt:'2026-06-01T09:00:00Z',job:'A',status:'Fallido',duration:30,attempts:3}];
    const a=O.executionSummary({sla:90},rows);assert.equal(a.count,2);assert.equal(a.average,45);assert.equal(a.retries,2);assert.equal(a.slaRate,.5);
    const filtered=O.executionSummary({status:'Fallido'},rows);assert.equal(filtered.count,1);assert.equal(filtered.slaRate,0);
});
test('Historial: filtros, rango vacío y validaciones',()=>{
    assert.equal(O.executionSummary({job:'ETL Ventas'}).count,10);assert.equal(O.executionSummary({from:'2026-06-01',to:'2026-06-01'}).count,3);
    assert.equal(O.executionSummary({job:'Sin trabajos'}).average,null);assert.throws(()=>O.executionSummary({sla:0}));
    assert.throws(()=>O.executionSummary({},[{...O.runs[0],duration:NaN}]));
    assert.throws(()=>O.executionSummary({from:'2026-07-01',to:'2026-06-01'}));
});
