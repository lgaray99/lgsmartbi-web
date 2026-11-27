const {test}=require('node:test');
const assert=require('node:assert/strict');
const E=require('../assets/js/commercial-engine.js');
test('Transformación determinista: conserva cada aceptado o rechazado',()=>{
    const r=E.transform(E.data.raw);
    assert.equal(r.accepted.length,84);assert.equal(r.rejected.length,17);
    assert.equal(r.accepted.length+r.rejected.length,E.data.raw.length);
    assert.deepEqual(r,E.transform(E.data.raw));
});
test('KPIs conocidos: múltiples líneas de una factura no duplican el ticket',()=>{
    const r=E.baseline.accepted[0],rows=[{...r,id:'A',orderId:'F1',qty:2,price:10,cost:6,sales:20,costs:12},{...r,id:'B',orderId:'F1',qty:3,price:20,cost:12,sales:60,costs:36}];
    const a=E.analyze({},rows);
    assert.equal(a.sales,80);assert.equal(a.costs,48);assert.equal(a.margin,32);assert.equal(a.marginRate,.4);assert.equal(a.quantity,5);assert.equal(a.invoices,1);assert.equal(a.ticket,80);
});
test('Filtros combinados coinciden con selección independiente',()=>{
    const f={from:'2026-02-01',to:'2026-04-30',branchId:'S001',category:'Panificados',customerId:'C001'};
    const rows=E.baseline.accepted.filter(r=>r.date>=f.from&&r.date<=f.to&&r.branchId===f.branchId&&r.customerId===f.customerId&&E.data.products.find(p=>p.id===r.productId).category===f.category);
    assert.deepEqual(E.analyze(f).rows,rows);
    for(const key of ['branchId','customerId','productId'])assert.equal(E.analyze({[key]:'INEXISTENTE'}).sales,0);
});
test('Selección vacía: ratios nulos y sin NaN',()=>{
    const a=E.analyze({from:'2027-01-01',to:'2027-12-31'});
    assert.equal(a.count,0);assert.equal(a.marginRate,null);assert.equal(a.ticket,null);assert.equal(a.sales,0);
});
test('Fechas inválidas y rangos inversos se rechazan',()=>{
    for(const date of ['2026-02-30','2026-13-01','25/11/2026','2026-1-01'])assert.throws(()=>E.analyze({from:date}));
    assert.throws(()=>E.analyze({from:'2026-06-01',to:'2026-01-01'}));
});
test('Validación detecta indicadores alterados y sumas incompatibles',()=>{
    const a=E.analyze();assert.ok(E.validateAnalysis(a));
    for(const key of ['sales','costs','margin','quantity','invoices','ticket','customers','products','marginRate','count'])assert.throws(()=>E.validateAnalysis({...a,[key]:a[key]+1}));
    for(const grouping of ['monthly','branches','categories'])for(const key of ['sales','costs','margin','quantity']) {
        const changed=structuredClone(a);changed[grouping][0][key]++;assert.throws(()=>E.validateAnalysis(changed));
    }
});
test('Importes enteros seguros y protección de desbordamientos',()=>{
    assert.equal(E.sum([100,-25]),75);assert.equal(E.multiply(3,25000),75000);
    assert.throws(()=>E.sum([Number.MAX_SAFE_INTEGER,1]));assert.throws(()=>E.multiply(Number.MAX_SAFE_INTEGER,2));
    for(const n of [null,'',NaN,1.2,'1e3',true,Infinity])assert.throws(()=>E.integer(n));
});
test('Dimensiones: claves únicas y calendario sin huecos',()=>{
    for(const dim of [E.data.products,E.data.customers,E.data.branches])assert.equal(new Set(dim.map(r=>r.id)).size,dim.length);
    assert.equal(E.data.calendar.length,365);assert.equal(E.data.calendar[0].date,'2026-01-01');assert.equal(E.data.calendar.at(-1).date,'2026-12-31');
});
test('ETL: normalización, tipos y motivos de rechazo',()=>{
    const r=E.transform(E.data.raw);
    assert.equal(r.accepted[0].id,'V-0101-1');assert.equal(r.accepted[0].status,'OK');assert.equal(typeof r.accepted[0].qty,'number');
    assert.ok(r.rejected.some(r=>r.reason.includes('duplicado')));assert.ok(r.rejected.some(r=>r.reason.includes('Fecha inválida')));
    assert.equal(r.audit.length,101);assert.equal(r.audit[0].raw.id,' V-0101-1 ');
    assert.deepEqual(E.transform([]).accepted,[]);assert.throws(()=>E.transform({}));
});
test('Carga incremental: actualización, inserción y repetición idempotente',()=>{
    const before=JSON.stringify(E.baseline.accepted),batch=E.incrementalExample();
    const first=E.incremental(E.baseline.accepted,batch);
    assert.equal(first.rows.length,85);assert.equal(first.stats.inserted,1);assert.equal(first.stats.updated,1);
    const again=E.incremental(first.rows,batch);
    assert.equal(again.stats.unchanged,2);assert.deepEqual(again.rows,first.rows);assert.equal(again.audit.length,2);
    assert.equal(JSON.stringify(E.baseline.accepted),before);
});
test('Carga incremental: versiones antiguas, conflicto y estado inválido',()=>{
    const current=E.incremental(E.baseline.accepted,E.incrementalExample());
    const stale=E.incremental(current.rows,[E.data.raw[0]]);assert.equal(stale.stats.stale,1);
    const conflict=E.incremental(current.rows,[{...E.incrementalExample()[0],qty:'99'}]);
    assert.equal(conflict.stats.conflicts,1);assert.deepEqual(conflict.rows,current.rows);
    assert.throws(()=>E.incremental([{...E.baseline.accepted[0],productId:'ERROR'}],[]));
});
test('Warehouse valida huérfanos, claves y medidas antes de usarlo',()=>{
    const row=E.baseline.accepted[0];assert.equal(E.warehouse().facts.length,84);
    assert.throws(()=>E.warehouse([row,row]));assert.throws(()=>E.warehouse([{...row,costs:1}]));
    assert.throws(()=>E.warehouse([{...row,branchId:'ERROR'}]));assert.throws(()=>E.warehouse([{...row,date:'2027-01-01'}]));
});
test('Documento no permite dimensiones incompatibles entre líneas',()=>{
    const first=E.data.raw[0],second={...E.data.raw[1],branchId:'S002'};
    assert.equal(E.transform([first,second]).rejected.length,1);
});
test('Consultas guiadas usan la misma evidencia y reglas explícitas',()=>{
    assert.equal(E.guided(0).value,5017000);assert.equal(E.guided(1,{branchId:'S002'}).value,E.analyze({branchId:'S001'}).sales);
    assert.equal(E.guided(2).value,E.analyze().quantity);
    const ranking=E.guided(3).ranking;assert.ok(ranking[0].sales>=ranking[1].sales);assert.equal(E.sum(ranking.map(r=>r.sales)),5017000);
    assert.equal(E.guided(4).value,2024000);assert.throws(()=>E.guided(5));
});
