/* Simuladores deterministas en memoria; no controlan ERP, carpetas ni tareas reales. */
(function(root) {
    'use strict';
    const node=typeof module!=='undefined'&&module.exports,E=node?require('./commercial-engine.js'):root.LGCommercial;
    const copy=value=>JSON.parse(JSON.stringify(value));
    function log(state,entity,message) {state.clock+=250;state.log.push({sequence:state.log.length+1,time:`T+${state.clock}ms`,entity,message});}
    function rpaInitial() {return {clock:0,log:[],tasks:[
        {id:'T-001',report:'Ventas',rows:84,fail:'none'},
        {id:'T-002',report:'Inventario',rows:12,fail:'transient'},
        {id:'T-003',report:'Catálogo inválido',rows:0,fail:'permanent'}
    ].map(r=>({...r,status:'En cola',attempts:0,stage:0,error:'',output:''}))};}
    const stages=['Abrir sesión sintética','Obtener reporte sintético','Validar esquema','Registrar resultado'];
    function rpaStep(current,maxRetries=1) {
        E.integer(maxRetries,'Reintentos',0,3);const state=copy(current);
        const task=state.tasks.find(t=>t.status==='Ejecutando')||state.tasks.find(t=>['En cola','Reintento'].includes(t.status));
        if(!task)return state;
        if(task.status!=='Ejecutando'){task.status='Ejecutando';task.attempts++;task.stage=0;task.error='';log(state,task.id,`Intento ${task.attempts}: inicio simulado`);return state;}
        if(task.stage===1&&(task.fail==='permanent'||task.fail==='transient'&&task.attempts===1)) {
            task.error=task.fail==='transient'?'TIMEOUT_SINTETICO':'ESQUEMA_SINTETICO_INVALIDO';
            task.status=task.attempts<=maxRetries?'Reintento':'Fallido';log(state,task.id,`${task.error}; ${task.status.toLowerCase()}`);return state;
        }
        log(state,task.id,stages[task.stage]);task.stage++;
        if(task.stage===stages.length){task.status='Completado';task.output=`demo-${task.report.toLowerCase()}.csv (${task.rows} filas sintéticas)`;}
        return state;
    }
    function rpaRun(state,retries=1) {
        E.integer(retries,'Reintentos',0,3);
        let next=state;
        for(let i=0;i<100&&next.tasks.some(t=>['En cola','Ejecutando','Reintento'].includes(t.status));i++)next=rpaStep(next,retries);
        return next;
    }
    const events=[
        {name:'ventas.parquet',kind:'create',signature:'ventas-v1',rows:84},
        {name:'ventas.parquet',kind:'modify',signature:'ventas-v1',rows:84},
        {name:'ventas.parquet',kind:'modify',signature:'ventas-v2',rows:85,error:'transient'},
        {name:'stock.parquet',kind:'create',signature:'stock-v1',rows:12},
        {name:'ventas.parquet',kind:'delete'},
        {name:'ventas.parquet',kind:'delete'},
        {name:'stock.parquet',kind:'modify',signature:'stock-v2',rows:13,error:'corrupt'},
        {name:'costos.parquet',kind:'create',signature:'costos-v1',rows:6}
    ];
    const monitorInitial=()=>({clock:0,log:[],observed:[],committed:[],queue:[],eventIndex:0,ignored:0});
    function observe(current,event) {
        if(!event||typeof event.name!=='string'||!/^[a-z0-9_-]+\.parquet$/i.test(event.name)||!['create','modify','delete'].includes(event.kind))throw Error('Evento o nombre de archivo inválido');
        if(event.kind!=='delete'&&(typeof event.signature!=='string'||!event.signature))throw Error('Firma sintética requerida');
        if(event.kind!=='delete')E.integer(event.rows,'Filas sintéticas',0,1000000);
        if(event.error&&!['transient','corrupt'].includes(event.error))throw Error('Tipo de error sintético inválido');
        const state=copy(current),old=state.observed.find(f=>f.name===event.name);
        if(event.kind==='delete'&&!old||event.kind!=='delete'&&old?.signature===event.signature) {
            state.ignored++;log(state,event.name,'Evento idéntico ignorado; no se reprocesa');return state;
        }
        state.observed=state.observed.filter(f=>f.name!==event.name);
        if(event.kind!=='delete')state.observed.push({...event});
        for(const item of state.queue)if(item.name===event.name&&['En cola','Reintento'].includes(item.status)){item.status='Obsoleto';log(state,item.id,'Evento reemplazado por una versión posterior');}
        state.queue.push({...event,id:`Q-${state.queue.length+1}`,status:'En cola',attempts:0,detail:''});
        log(state,event.name,`${event.kind}: cambio detectado y encolado`);return state;
    }
    function detectNext(state) {
        if(state.eventIndex>=events.length)return copy(state);
        const next=observe(state,events[state.eventIndex]);next.eventIndex++;return next;
    }
    function processMonitor(current,maxRetries=1) {
        E.integer(maxRetries,'Reintentos',0,3);const state=copy(current),item=state.queue.find(q=>['En cola','Reintento'].includes(q.status));if(!item)return state;
        item.attempts++;
        if(item.error==='corrupt'||item.error==='transient'&&item.attempts===1) {
            item.status=item.attempts<=maxRetries?'Reintento':'Error';item.detail=item.error==='corrupt'?'METADATOS_SINTETICOS_INVALIDOS':'ERROR_TRANSITORIO_SINTETICO';
            log(state,item.id,`${item.detail}; ${item.status}`);return state;
        }
        state.committed=state.committed.filter(f=>f.name!==item.name);
        if(item.kind!=='delete')state.committed.push({name:item.name,signature:item.signature,rows:item.rows});
        item.status='Completado';item.detail=item.kind==='delete'?'Baja del materializado en memoria':'Firma confirmada en memoria';
        log(state,item.id,item.detail);return state;
    }
    const bom={
        materials:[{id:'HAR',name:'Harina',unit:'kg',stockBase:5000},{id:'QUE',name:'Queso',unit:'kg',stockBase:1000},{id:'EMP',name:'Empaque individual',unit:'unidad',stockBase:15},{id:'AGU',name:'Agua',unit:'l',stockBase:10000},{id:'AZU',name:'Azúcar',unit:'kg',stockBase:3000},{id:'HUE',name:'Huevo',unit:'unidad',stockBase:30},{id:'CAJ',name:'Caja combo',unit:'unidad',stockBase:10}],
        recipes:{
            P001:[{id:'HAR',quantity:300,unit:'g'},{id:'AGU',quantity:180,unit:'ml'},{id:'EMP',quantity:1,unit:'unidad'}],
            P002:[{id:'HAR',quantity:230,unit:'g'},{id:'QUE',quantity:80,unit:'g'},{id:'EMP',quantity:1,unit:'unidad'}],
            P003:[{id:'HAR',quantity:200,unit:'g'},{id:'AZU',quantity:100,unit:'g'},{id:'HUE',quantity:1,unit:'unidad'},{id:'EMP',quantity:1,unit:'unidad'}],
            P006:[{id:'P001',quantity:1,unit:'unidad'},{id:'P002',quantity:2,unit:'unidad'},{id:'CAJ',quantity:1,unit:'unidad'}]
        },
        movements:[{id:'HAR',quantity:'4.700',unit:'kg'},{id:'QUE',quantity:'1.550',unit:'kg'},{id:'EMP',quantity:'21',unit:'unidad'}]
    };
    const units={g:{dimension:'mass',scale:1},kg:{dimension:'mass',scale:1000},ml:{dimension:'volume',scale:1},l:{dimension:'volume',scale:1000},unidad:{dimension:'count',scale:1}};
    function baseQuantity(value,unit,targetUnit) {
        const source=units[unit],target=units[targetUnit];
        if(!source||!target||source.dimension!==target.dimension)throw Error('Unidades incompatibles o desconocidas');
        const text=String(value);
        if(!/^\d+(?:\.\d{1,3})?$/.test(text))throw Error('Cantidad: número no negativo con hasta tres decimales');
        const [whole,fraction='']=text.split('.'),numerator=(BigInt(whole)*1000n+BigInt(fraction.padEnd(3,'0')))*BigInt(source.scale);
        if(numerator%1000n)throw Error('Cantidad menor a la resolución base (g, ml o unidad entera)');
        return E.exact(numerator/1000n);
    }
    function materialPlan(production,recipes=bom.recipes,movements=bom.movements) {
        if(!Array.isArray(production)||production.length>50||!recipes||Array.isArray(recipes)||typeof recipes!=='object'||Object.keys(recipes).length>100||!Array.isArray(movements)||movements.length>1000)throw Error('Estructura BOM o movimientos inválidos');
        const materials=new Map(bom.materials.map(r=>[r.id,r])),memo=new Map();
        if(Object.keys(recipes).some(key=>materials.has(key)))throw Error('Una clave de receta no puede ser también una materia prima');
        function expand(product,path=[]) {
            if(path.includes(product))throw Error('Referencia circular BOM: '+[...path,product].join(' → '));
            if(path.length>20)throw Error('BOM demasiado profundo');
            if(memo.has(product))return memo.get(product);
            if(!Object.hasOwn(recipes,product)||!Array.isArray(recipes[product])||!recipes[product].length||recipes[product].length>50)throw Error('Producto sin receta válida: '+product);
            const result=new Map(),seen=new Set();
            for(const edge of recipes[product]) {
                if(!edge||typeof edge.id!=='string'||seen.has(edge.id))throw Error('Material o componente duplicado/inválido en receta');seen.add(edge.id);
                const material=materials.get(edge.id);
                const count=baseQuantity(edge.quantity,edge.unit,material?.unit||'unidad');
                if(count<=0)throw Error('Cantidad por receta debe ser positiva');
                const child=material?new Map([[edge.id,count]]):new Map([...expand(edge.id,[...path,product])].map(([key,n])=>[key,E.multiply(n,count)]));
                for(const [key,n] of child)result.set(key,E.sum([result.get(key)||0,n]));
            }
            memo.set(product,result);return result;
        }
        Object.keys(recipes).forEach(key=>expand(key)); // Validar ciclos incluso con producción cero.
        const required=new Map(),recorded=new Map(),seenProducts=new Set();
        for(const row of production) {
            if(!row||typeof row.productId!=='string'||seenProducts.has(row.productId))throw Error('Producto de producción inválido o repetido');seenProducts.add(row.productId);
            const count=E.integer(row.qty,'Producción',0,100000);
            for(const [key,n] of expand(row.productId))required.set(key,E.sum([required.get(key)||0,E.multiply(n,count)]));
        }
        for(const row of movements) {
            const material=materials.get(row?.id);if(!material)throw Error('Movimiento con material desconocido');
            const n=baseQuantity(row.quantity,row.unit,material.unit);recorded.set(row.id,E.sum([recorded.get(row.id)||0,n]));
        }
        return [...new Set([...required.keys(),...recorded.keys()])].map(id=>{
            const material=materials.get(id),scale=units[material.unit].scale,theory=required.get(id)||0,actual=recorded.has(id)?recorded.get(id):null;
            return {...material,required:theory/scale,recorded:actual===null?null:actual/scale,difference:actual===null?null:E.sum([actual,-theory])/scale,
                available:material.stockBase/scale,shortage:Math.max(0,theory-material.stockBase)/scale};
        });
    }
    const runs=Array.from({length:30},(_,i)=>{
        const failed=i%7===0,recovered=!failed&&i%4===0;
        return {id:`RUN-${String(i+1).padStart(3,'0')}`,job:['ETL Ventas','Monitor Parquet','Actualización BI'][i%3],
            startedAt:`2026-06-${String(1+Math.floor(i/3)).padStart(2,'0')}T${String(8+i%3).padStart(2,'0')}:00:00Z`,
            duration:30+(i*17)%120,status:failed?'Fallido':recovered?'Recuperado':'Completado',attempts:failed?3:recovered?2:1,
            error:failed?'ERROR_ESQUEMA_SINTETICO':recovered?'TIMEOUT_SINTETICO_RESUELTO':''};
    });
    function executionSummary(filters={},input=runs) {
        if(!Array.isArray(input)||input.length>20000)throw Error('Historial inválido');
        input.forEach(r=>{
            if(!r||typeof r.job!=='string'||!r.job||!['Completado','Recuperado','Fallido'].includes(r.status))throw Error('Ejecución con proceso o estado inválido');
            E.timestamp(r.startedAt);E.integer(r.duration,'Duración segundos',0,86400);E.integer(r.attempts,'Intentos',1,10);
        });
        if(filters.from)E.date(filters.from);if(filters.to)E.date(filters.to);
        if(filters.from&&filters.to&&filters.from>filters.to)throw Error('Rango de fechas inválido');
        const sla=E.integer(filters.sla??90,'SLA segundos',1,3600);
        const rows=input.filter(r=>(!filters.from||r.startedAt.slice(0,10)>=filters.from)&&(!filters.to||r.startedAt.slice(0,10)<=filters.to)&&(!filters.job||r.job===filters.job)&&(!filters.status||r.status===filters.status));
        const success=rows.filter(r=>r.status!=='Fallido').length,compliant=rows.filter(r=>r.status!=='Fallido'&&r.duration<=sla).length;
        return {rows,count:rows.length,success,failed:rows.length-success,retries:rows.reduce((n,r)=>n+r.attempts-1,0),
            average:rows.length?rows.reduce((n,r)=>n+r.duration,0)/rows.length:null,compliant,slaRate:rows.length?compliant/rows.length:null,sla};
    }
    const api={rpaInitial,rpaStep,rpaRun,stages,events,monitorInitial,observe,detectNext,processMonitor,bom,baseQuantity,materialPlan,runs,executionSummary};
    root.LGOperations=api;if(node)module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this);
