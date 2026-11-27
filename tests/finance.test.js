const {test}=require('node:test'),assert=require('node:assert/strict'),F=require('../assets/js/finance-engine.js');
const row=(id,amount,date='2026-01-01',ref='001')=>({id,ref,date,amount});
test('Grupos extensos: fecha máxima sin producto cartesiano ni desbordamiento',()=>{
    for(const count of [500,20000]) {
        const left=Array.from({length:count},(_,i)=>row('L'+i,i+1,i%2?'2026-01-03':'2026-01-01'));
        const right=Array.from({length:count},(_,i)=>row('R'+i,i+1,i%2?'2026-01-05':'2026-01-02'));
        const result=F.reconcile(left,right);
        assert.equal(result.length,1);assert.equal(result[0].status,'Ambiguo');assert.equal(result[0].dayGap,4);
        assert.equal(result[0].originCount,count);assert.equal(result[0].destinationCount,count);
        assert.equal(result[0].origin,count*(count+1)/2);
    }
    const result=F.reconcile([row('L1',1,null),row('L2',2,null)],[row('R1',3,null)]);
    assert.equal(result[0].dayGap,null);assert.equal(result[0].datesVerified,false);
});
test('Banca: escenarios exactos, fechas, importes, duplicados, ambiguos y uno a varios',()=>{
    const rows=F.reconcile(F.sample.bankLeft,F.sample.bankRight);
    for(const status of ['Conciliado','Diferencia de importe','Diferencia de fecha','Duplicado','Ambiguo','Uno a varios','Solo en origen','Solo en destino'])assert.ok(rows.some(r=>r.status===status),status);
    assert.equal(rows.filter(r=>r.matched).length,2);
});
test('Tolerancias monetarias y temporales cambian coincidencias conservadoramente',()=>{
    assert.equal(F.reconcile([row('A',100)],[row('B',99,'2026-01-03')])[0].matched,false);
    assert.equal(F.reconcile([row('A',100)],[row('B',99,'2026-01-03')],{amountTolerance:1,dayTolerance:2})[0].status,'Conciliado con tolerancia');
    assert.equal(F.reconcile([row('A',-100)],[row('B',-100)])[0].matched,true);
});
test('Subconjuntos únicos conservan remanentes sin reutilizar filas',()=>{
    const rows=F.reconcile([row('A',100)],[row('B',60),row('C',40),row('D',20)]);
    assert.equal(rows.length,2);assert.equal(rows[0].status,'Uno a varios');assert.equal(rows[1].destination,20);
    assert.equal(new Set(rows.flatMap(r=>r.destinationIds)).size,3);
});
test('Ambigüedad: varias combinaciones, duplicados y muchos a muchos',()=>{
    assert.equal(F.reconcile([row('A',100)],[row('B',60),row('C',40),row('D',100)])[0].status,'Ambiguo');
    assert.equal(F.reconcile([row('A',100)],[row('B',50),row('C',50)])[0].status,'Duplicado');
    assert.equal(F.reconcile([row('A',60),row('B',40)],[row('C',30),row('D',70)])[0].status,'Ambiguo');
    assert.equal(F.reconcile([row('A',100)],[row('B',60),row('C',40)],{oneToMany:false})[0].status,'Ambiguo');
});
test('Toda fila de ambos conjuntos queda representada exactamente una vez',()=>{
    const rows=F.reconcile(F.sample.bankLeft,F.sample.bankRight);
    assert.equal(rows.reduce((n,r)=>n+r.originCount,0),F.sample.bankLeft.length);assert.equal(rows.reduce((n,r)=>n+r.destinationCount,0),F.sample.bankRight.length);
});
test('CSV anterior y ampliado; códigos con ceros y fechas inválidas',()=>{
    assert.equal(F.read('referencia;importe\n001;100\n')[0].ref,'001');
    assert.equal(F.read('id;referencia;fecha;importe\n001;A;2026-01-01;100\n')[0].id,'001');
    assert.throws(()=>F.read('id;referencia;fecha;importe\n001;A;2026-02-30;100\n'));
    assert.throws(()=>F.read('referencia;importe\n001;1.5\n'));
});
test('Importes y parámetros inválidos se rechazan sin mutar entradas',()=>{
    const l=[row('A',100)],before=JSON.stringify(l);
    for(const amount of [NaN,Infinity,1.2,1e13])assert.throws(()=>F.reconcile([{...l[0],amount}],[]));
    assert.throws(()=>F.reconcile(l,[],{dayTolerance:-1}));assert.equal(JSON.stringify(l),before);assert.deepEqual(F.reconcile([],[]),[]);
});
test('Tasas enteras: redondeo monetario exacto y porcentajes de dos decimales',()=>{
    assert.equal(F.rateAmount(101,5000),51);assert.equal(F.rateAmount(-101,5000),-51);
    assert.equal(F.percentBps('2.35'),235);assert.equal(F.rateAmount(100000,235),2350);
    for(const value of ['NaN','','1.111','-1','1e2'])assert.throws(()=>F.percentBps(value));
});
test('Procesadoras: dos coincidencias, diferencia, pendiente y sin venta',()=>{
    const r=F.processor(F.sample.cardSales,F.sample.cardPaid);
    assert.equal(r.rows.filter(x=>x.matched).length,2);assert.ok(r.rows.some(x=>x.status==='Liquidación pendiente'));assert.ok(r.rows.some(x=>x.status==='Diferencia de importe'));
    assert.equal(r.breakdown[0].fee,2000);assert.equal(r.breakdown[0].net,98000);
    const overdue=F.processor(F.sample.cardSales,F.sample.cardPaid,{asOf:'2026-07-03'});assert.ok(overdue.rows.some(x=>x.status==='Liquidación vencida'));
});
test('Procesadoras: retenciones y corte preservan trazabilidad',()=>{
    const r=F.processor(F.sample.cardSales,F.sample.cardPaid,{retentionBps:100});
    assert.equal(r.breakdown[0].retention,1000);assert.equal(r.breakdown[0].net,97000);
    const cut=F.processor(F.sample.cardSales,F.sample.cardPaid,{asOf:'2026-06-01'});assert.equal(cut.excluded,7);
    assert.throws(()=>F.processor([row('A',-100)],[]));
});
