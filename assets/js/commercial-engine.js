/* Reglas puras compartidas por LG-005/006/007/010; importes PYG enteros exactos. */
(function(root) {
    'use strict';
    const D=typeof module!=='undefined'&&module.exports?require('./commercial-data.js'):root.LGCommercialData;
    function integer(value, name='Número', min=0, max=Number.MAX_SAFE_INTEGER) {
        if(typeof value==='string' && !/^-?\d+$/.test(value.trim()))throw Error(`${name}: se requiere un entero`);
        const n=typeof value==='number'?value:typeof value==='string'?Number(value):NaN;
        if(!Number.isSafeInteger(n)||n<min||n>max)throw RangeError(`${name}: entero fuera de rango`);
        return n;
    }
    function exact(value) {
        if(value>BigInt(Number.MAX_SAFE_INTEGER)||value<BigInt(Number.MIN_SAFE_INTEGER))throw RangeError('Importe fuera del rango numérico seguro');
        return Number(value);
    }
    const sum=values=>exact(values.reduce((s,n)=>s+BigInt(integer(n,'Importe',Number.MIN_SAFE_INTEGER)),0n));
    const multiply=(a,b)=>exact(BigInt(integer(a))*BigInt(integer(b)));
    function date(value) {
        if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(value)||!Number.isFinite(Date.parse(value+'T00:00:00Z'))||new Date(value+'T00:00:00Z').toISOString().slice(0,10)!==value)throw Error('Fecha inválida: usá AAAA-MM-DD');
        return value;
    }
    function timestamp(value) {
        if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(value)||!Number.isFinite(Date.parse(value))||new Date(value).toISOString().replace('.000Z','Z')!==value)throw Error('updatedAt inválido: usá UTC AAAA-MM-DDThh:mm:ssZ');
        return value;
    }
    function transform(input) {
        if(!Array.isArray(input)||input.length>20000)throw Error('Se requiere un arreglo de hasta 20.000 registros');
        const accepted=[], rejected=[], audit=[], seen=new Set(),documents=new Map();
        input.forEach((raw,index)=>{
            try {
                if(!raw||typeof raw!=='object')throw Error('Registro inválido');
                const row={};
                for(const field of ['id','orderId','branchId','customerId','productId','source']) {
                    if(typeof raw[field]!=='string'||!raw[field].trim())throw Error(`${field}: campo requerido`);
                    row[field]=raw[field].trim();
                }
                row.status=String(raw.status??'').trim().toUpperCase();
                if(row.status!=='OK')throw Error('Estado excluido: solo OK');
                row.date=date(raw.date); row.updatedAt=timestamp(raw.updatedAt);
                for(const [key,dim] of [['branchId',D.branches],['customerId',D.customers],['productId',D.products]])
                    if(!dim.some(r=>r.id===row[key]))throw Error(`${key}: clave desconocida`);
                row.qty=integer(raw.qty,'Cantidad',1,1000000);
                row.price=integer(raw.price,'Precio',0,1000000000); row.cost=integer(raw.cost,'Costo',0,1000000000);
                row.sales=multiply(row.qty,row.price); row.costs=multiply(row.qty,row.cost);
                if(seen.has(row.id))throw Error('ID duplicado en lote');
                const context=JSON.stringify([row.date,row.branchId,row.customerId]);
                if(documents.has(row.orderId)&&documents.get(row.orderId)!==context)throw Error('Documento con fecha, sucursal o cliente incompatible');
                documents.set(row.orderId,context);
                seen.add(row.id);accepted.push(row);audit.push({index:index+1,raw,row,status:'Aceptado',reason:''});
            } catch(error) { const entry={index:index+1,raw,reason:error.message};rejected.push(entry);audit.push({...entry,status:'Rechazado'}); }
        });
        return {accepted,rejected,audit,total:sum(accepted.map(r=>r.sales)), costs:sum(accepted.map(r=>r.costs))};
    }
    const baseline=transform(D.raw);
    function filtered(filters={}, input=baseline.accepted) {
        if(filters.from)date(filters.from);if(filters.to)date(filters.to);
        if(filters.from&&filters.to&&filters.from>filters.to)throw Error('La fecha inicial supera la fecha final');
        return input.filter(r=>(!filters.from||r.date>=filters.from)&&(!filters.to||r.date<=filters.to)&&
            ['branchId','customerId','productId'].every(k=>!filters[k]||r[k]===filters[k])&&
            (!filters.category||D.products.find(p=>p.id===r.productId)?.category===filters.category));
    }
    function aggregate(rows) {
        const sales=sum(rows.map(r=>r.sales)), costs=sum(rows.map(r=>r.costs));
        const invoices=new Set(rows.map(r=>r.orderId)).size;
        return {sales,costs,margin:sum([sales,-costs]),marginRate:sales?(sales-costs)/sales:null,
            quantity:sum(rows.map(r=>r.qty)), invoices,ticket:invoices?sales/invoices:null,
            customers:new Set(rows.map(r=>r.customerId)).size,products:new Set(rows.map(r=>r.productId)).size,count:rows.length};
    }
    function group(rows,key) {
        const map=new Map();
        rows.forEach(r=>{const k=typeof key==='function'?key(r):r[key];if(!map.has(k))map.set(k,[]);map.get(k).push(r);});
        return [...map].map(([key,items])=>({key,...aggregate(items)})).sort((a,b)=>String(a.key).localeCompare(String(b.key)));
    }
    function analyze(filters={}, input=baseline.accepted) {
        const rows=filtered(filters,input), totals=aggregate(rows);
        const months=[...new Set(D.calendar.filter(d=>(!filters.from||d.date>=filters.from)&&(!filters.to||d.date<=filters.to)).map(d=>d.date.slice(0,7)))];
        const monthly=months.map(key=>({key,...aggregate(rows.filter(r=>r.date.startsWith(key)))}));
        const result={rows,...totals,monthly,branches:group(rows,'branchId'),categories:group(rows,r=>D.products.find(p=>p.id===r.productId).category)};
        validateAnalysis(result);
        return result;
    }
    function validateAnalysis(result) {
        // Recálculo independiente a partir de líneas: evita indicadores de fuentes distintas.
        let sales=0n,costs=0n,quantity=0n;
        result.rows.forEach(r=>{sales+=BigInt(r.qty)*BigInt(r.price);costs+=BigInt(r.qty)*BigInt(r.cost);quantity+=BigInt(r.qty);});
        if(result.sales!==exact(sales)||result.costs!==exact(costs)||result.margin!==exact(sales-costs)||result.quantity!==exact(quantity)||
            [result.monthly,result.branches,result.categories].some(group=>['sales','costs','margin','quantity'].some(key=>sum(group.map(r=>r[key]))!==result[key]))||result.invoices!==new Set(result.rows.map(r=>r.orderId)).size||
            result.customers!==new Set(result.rows.map(r=>r.customerId)).size||result.products!==new Set(result.rows.map(r=>r.productId)).size||
            result.count!==result.rows.length||result.ticket!==(result.invoices?result.sales/result.invoices:null)||
            result.marginRate!==(result.sales?result.margin/result.sales:null))throw Error('Los indicadores no concuerdan con los registros');
        return true;
    }
    function incremental(current, input) {
        warehouse(current); // Validar el estado previo completo antes de preparar la carga.
        const transformed=transform(input), map=new Map(current.map(r=>[r.id,{...r}]));
        const rejected=[...transformed.rejected], audit=transformed.audit.map(r=>({...r})), stats={inserted:0,updated:0,unchanged:0,stale:0,conflicts:0};
        const accepted=[];
        for(const row of transformed.accepted) {
            const entry=audit.find(r=>r.status==='Aceptado'&&r.row.id===row.id);
            const old=map.get(row.id);
            if(old&&row.updatedAt<old.updatedAt){stats.stale++;entry.status='Versión antigua';continue;}
            if(old&&row.updatedAt===old.updatedAt) {
                if(Object.keys(row).every(k=>row[k]===old[k])){stats.unchanged++;entry.status='Sin cambio';}
                else {stats.conflicts++;entry.status='Rechazado';entry.reason='Misma versión UTC con contenido distinto';rejected.push(entry);}
                continue;
            }
            const context=JSON.stringify([row.date,row.branchId,row.customerId]);
            if([...map.values()].some(r=>r.id!==row.id&&r.orderId===row.orderId&&JSON.stringify([r.date,r.branchId,r.customerId])!==context)) {
                stats.conflicts++;entry.status='Rechazado';entry.reason='Documento incompatible con el estado cargado';rejected.push(entry);continue;
            }
            map.set(row.id,row);accepted.push(row);stats[old?'updated':'inserted']++;
        }
        const rows=[...map.values()];warehouse(rows);
        return {rows,accepted,rejected,audit,stats,total:sum(rows.map(r=>r.sales)),costs:sum(rows.map(r=>r.costs))};
    }
    function warehouse(rows=baseline.accepted) {
        if(!Array.isArray(rows)||rows.length>20000)throw Error('Estado de carga inválido');
        if(transform(rows).rejected.length)throw Error('Estado de carga con hechos inválidos');
        const ids=new Set(), documents=new Map();
        for(const row of rows) {
            if(!row.id||ids.has(row.id))throw Error('Hecho sin clave o con clave duplicada');ids.add(row.id);
            for(const [key,dim] of [['branchId',D.branches],['customerId',D.customers],['productId',D.products]])
                if(!dim.some(d=>d.id===row[key]))throw Error('Clave huérfana: '+key);
            if(!D.calendar.some(d=>d.date===row.date))throw Error('Fecha fuera del calendario 2026');
            timestamp(row.updatedAt);
            if(row.sales!==multiply(row.qty,row.price)||row.costs!==multiply(row.qty,row.cost))throw Error('Importe de hecho inconsistente');
            const context=JSON.stringify([row.date,row.branchId,row.customerId]);
            if(documents.has(row.orderId)&&documents.get(row.orderId)!==context)throw Error('Documento dimensional inconsistente');
            documents.set(row.orderId,context);
        }
        return {facts:rows,products:D.products,customers:D.customers,branches:D.branches,dates:D.calendar};
    }
    function incrementalExample() {
        const first={...D.raw[0],id:D.raw[0].id.trim(),qty:String(Number(D.raw[0].qty)+1),updatedAt:'2026-07-01T12:00:00Z'};
        const added={...D.raw[1],id:'INC-001',orderId:'V-INC-001',date:'2026-07-01',updatedAt:'2026-07-01T12:00:00Z'};
        return [first,added];
    }
    function guided(question,filters={}) {
        integer(question,'Consulta guiada',0,4);
        const applied=question===1?{...filters,branchId:'S001'}:filters;
        const a=analyze(applied);
        const ranking=question===3?group(a.rows,'productId').sort((a,b)=>b.sales-a.sales||a.key.localeCompare(b.key)):question===4?group(a.rows,'branchId'):[];
        return {question,filters:applied,analysis:a,value:question===2?a.quantity:question===4?a.margin:a.sales,ranking};
    }
    const api={data:D,integer,exact,sum,multiply,date,timestamp,transform,baseline,filtered,aggregate,group,analyze,validateAnalysis,incremental,warehouse,incrementalExample,guided};
    root.LGCommercial=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this);
