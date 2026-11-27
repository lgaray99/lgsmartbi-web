/* Regenera exclusivamente datasets públicos sintéticos desde la misma fuente del navegador. */
const fs=require('node:fs'),path=require('node:path');
const E=require('../assets/js/commercial-engine.js'),csv=require('../assets/js/demo-engine.js').serializeCsv;
const out=path.join(__dirname,'../downloads');fs.mkdirSync(out,{recursive:true});
const tables={
    ventas:[['id','documento','fecha','sucursal_id','cliente_id','producto_id','cantidad','precio_pyg','costo_unitario_pyg','ventas_pyg','costos_pyg'],...E.baseline.accepted.map(r=>[r.id,r.orderId,r.date,r.branchId,r.customerId,r.productId,r.qty,r.price,r.cost,r.sales,r.costs])],
    productos:[['id','nombre','categoria','unidad'],...E.data.products.map(r=>[r.id,r.name,r.category,r.unit])],
    clientes:[['id','nombre'],...E.data.customers.map(r=>[r.id,r.name])],
    sucursales:[['id','nombre'],...E.data.branches.map(r=>[r.id,r.name])],
    fechas:[['fecha','anio','mes','trimestre'],...E.data.calendar.map(r=>[r.date,r.year,r.month,r.quarter])]
};
for(const [name,rows] of Object.entries(tables))fs.writeFileSync(path.join(out,name+'.csv'),'\uFEFF'+csv(rows,';'));
fs.writeFileSync(path.join(out,'origen-ventas.json'),JSON.stringify(E.data.raw,null,2)+'\n');
const literal=v=>typeof v==='number'?String(v):"'"+String(v).replaceAll("'","''")+"'";
let sql='-- Dataset público determinista DemoComercial S.A. Sin datos empresariales.\nBEGIN;\n'+fs.readFileSync(path.join(__dirname,'schema-postgresql.sql'),'utf8')+'\n';
for(const name of ['productos','clientes','sucursales','fechas','ventas']) {
    const [allHeaders,...allRows]=tables[name];
    const headers=name==='ventas'?allHeaders.slice(0,9):allHeaders;
    const rows=name==='ventas'?allRows.map(r=>r.slice(0,9)):allRows;
    sql+=`INSERT INTO demo_comercial.${name} (${headers.join(',')}) VALUES\n`+rows.map(r=>'('+r.map(literal).join(',')+')').join(',\n')+
        `\nON CONFLICT (${headers[0]}) DO UPDATE SET `+headers.slice(1).map(h=>`${h}=EXCLUDED.${h}`).join(',')+';\n';
}
fs.writeFileSync(path.join(out,'modelo-postgresql.sql'),sql+'COMMIT;\n');
console.log(`Datasets sintéticos: ${E.data.raw.length} entradas, ${E.baseline.accepted.length} hechos válidos, ${E.baseline.rejected.length} rechazos. Ventas ${E.baseline.total}, costos ${E.baseline.costs}.`);
