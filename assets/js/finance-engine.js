/* Conciliación conservadora por referencia. PYG enteros; sin combinaciones ambiguas. */
(function(root) {
    'use strict';
    const node=typeof module!=='undefined'&&module.exports;
    const E=node?require('./commercial-engine.js'):root.LGCommercial;
    const CSV=node?require('./demo-engine.js'):root.LGPortfolioDemo;
    function rateAmount(amount,bps) {
        E.integer(amount,'Importe',-1e12,1e12);E.integer(bps,'Tasa (puntos básicos)',0,10000);
        const value=BigInt(Math.abs(amount))*BigInt(bps),rounded=(value+5000n)/10000n;
        return E.exact(amount<0?-rounded:rounded);
    }
    function percentBps(text,max=10000) {
        if(typeof text!=='string'||!/^\d+(?:\.\d{1,2})?$/.test(text))throw Error('Tasa: usá porcentaje con hasta dos decimales');
        const [whole,fraction='']=text.split('.');return E.integer(Number(whole)*100+Number(fraction.padEnd(2,'0')),'Tasa',0,max);
    }
    function movements(rows,side) {
        if(!Array.isArray(rows)||rows.length>20000)throw Error('Máximo 20.000 movimientos por conjunto');
        return rows.map((r,i)=>{
            if(!r||typeof r.ref!=='string'||!r.ref.trim()||r.ref.length>120)throw Error(`Fila ${i+1}: referencia inválida`);
            if(r.id!==undefined&&(typeof r.id!=='string'||!r.id.trim()))throw Error(`Fila ${i+1}: ID inválido`);
            return {id:r.id?.trim()||`${side}-${i+1}`,ref:r.ref.trim().toUpperCase(),date:r.date?E.date(r.date):null,amount:E.integer(r.amount,'Importe PYG',-1e12,1e12)};
        });
    }
    const days=(a,b)=>a&&b?Math.abs(Date.parse(a+'T00:00:00Z')-Date.parse(b+'T00:00:00Z'))/86400000:null;
    const total=rows=>rows.length?E.sum(rows.map(r=>r.amount)):null;
    function reconcile(left,right,options={}) {
        const amountTolerance=E.integer(options.amountTolerance??0,'Tolerancia PYG',0,1000000);
        const dayTolerance=E.integer(options.dayTolerance??0,'Tolerancia días',0,30);
        const oneToMany=options.oneToMany??true;
        if(typeof oneToMany!=='boolean')throw Error('Regla uno a varios inválida');
        const L=movements(left,'O'),R=movements(right,'D'),groups=new Map(),result=[];
        const duplicatedIds=rows=>{const seen=new Set(),duplicates=new Set();for(const r of rows){if(seen.has(r.id))duplicates.add(r.id);seen.add(r.id);}return duplicates;};
        const duplicateLeft=duplicatedIds(L),duplicateRight=duplicatedIds(R);
        for(const [rows,side] of [[L,'left'],[R,'right']])for(const row of rows){if(!groups.has(row.ref))groups.set(row.ref,{left:[],right:[]});groups.get(row.ref)[side].push(row);}
        function add(ref,a,b,status,reason='') {
            const origin=total(a),destination=total(b);
            // La mayor distancia entre dos conjuntos se obtiene de sus extremos,
            // sin construir a.length × b.length pares ni expandirlos como argumentos.
            const ranges=[a,b].map(rows=>{
                let min=Infinity,max=-Infinity;
                for(const row of rows)if(row.date){const value=Date.parse(row.date+'T00:00:00Z');min=Math.min(min,value);max=Math.max(max,value);}
                return {min,max};
            });
            const dayGap=Number.isFinite(ranges[0].min)&&Number.isFinite(ranges[1].min)?
                Math.max(Math.abs(ranges[0].max-ranges[1].min),Math.abs(ranges[1].max-ranges[0].min))/86400000:null;
            const datesVerified=a.length>0&&b.length>0&&[...a,...b].every(r=>r.date!==null);
            result.push({ref,origin,destination,difference:origin!==null&&destination!==null?E.sum([origin,-destination]):null,
                originCount:a.length,destinationCount:b.length,originIds:a.map(r=>r.id),destinationIds:b.map(r=>r.id),
                originDates:a.map(r=>r.date),destinationDates:b.map(r=>r.date),dayGap,datesVerified,
                status,reason:reason+([...a,...b].some(r=>r.date===null)?' Fechas no verificables en filas sin fecha.':!a.length||!b.length?' Sin contraparte para verificar fechas.':''),matched:['Conciliado','Conciliado con tolerancia','Uno a varios'].includes(status)});
        }
        const repeated=rows=>new Set(rows.map(r=>JSON.stringify([r.date,r.amount]))).size<rows.length;
        for(const [ref,{left:a,right:b}] of groups) {
            if(repeated(a)||repeated(b)||a.some(r=>duplicateLeft.has(r.id))||b.some(r=>duplicateRight.has(r.id))){add(ref,a,b,'Duplicado','Filas idénticas por referencia/fecha/importe o ID repetido; revisión manual.');continue;}
            if(!a.length||!b.length){add(ref,a,b,a.length?'Solo en origen':'Solo en destino');continue;}
            if(a.length===1&&b.length===1) {
                const delta=E.sum([a[0].amount,-b[0].amount]),gap=days(a[0].date,b[0].date);
                add(ref,a,b,Math.abs(delta)>amountTolerance?'Diferencia de importe':gap!==null&&gap>dayTolerance?'Diferencia de fecha':delta===0&&(gap===0||gap===null)?'Conciliado':'Conciliado con tolerancia');continue;
            }
            if(!oneToMany||Math.min(a.length,b.length)!==1||Math.max(a.length,b.length)>10){add(ref,a,b,'Ambiguo','Agrupación desactivada, muchos a muchos o más de diez candidatos; no se empareja.');continue;}
            const single=a.length===1?a:b,many=a.length===1?b:a,candidates=[],amountCandidates=[];
            for(let mask=1;mask<(1<<many.length);mask++) {
                const subset=many.filter((_,i)=>mask&(1<<i));
                if(Math.abs(E.sum(subset.map(r=>r.amount))-single[0].amount)<=amountTolerance){amountCandidates.push(subset);if(subset.every(r=>days(r.date,single[0].date)===null||days(r.date,single[0].date)<=dayTolerance))candidates.push(subset);}
            }
            if(candidates.length!==1){add(ref,a,b,candidates.length?'Ambiguo':amountCandidates.length?'Diferencia de fecha':'Diferencia de importe',candidates.length?'Varias combinaciones cumplen las tolerancias.':'No hay combinación única que cumpla importe y fechas.');continue;}
            const chosen=candidates[0],rest=many.filter(r=>!chosen.includes(r));
            const status=chosen.length>1?'Uno a varios':chosen[0].amount===single[0].amount&&(days(chosen[0].date,single[0].date)===0||days(chosen[0].date,single[0].date)===null)?'Conciliado':'Conciliado con tolerancia';
            add(ref,a.length===1?single:chosen,a.length===1?chosen:single,status,'Única combinación por referencia, importe y fecha; cada fila se consume una vez.');
            if(rest.length)add(ref,a.length===1?[]:rest,a.length===1?rest:[],a.length===1?'Solo en destino':'Solo en origen','Remanente no conciliado de la referencia.');
        }
        return result;
    }
    function read(text) {
        const rows=CSV.validateCsv(CSV.parseCsv(text,';')),header=rows[0].join(';');
        if(header==='referencia;importe')return movements(CSV.readMovements(text),'CSV');
        if(header!=='id;referencia;fecha;importe')throw Error('Encabezado: id;referencia;fecha;importe (o referencia;importe, sin verificar fechas)');
        return movements(rows.slice(1).map(r=>({id:r[0],ref:r[1],date:r[2],amount:r[3]})),'CSV');
    }
    function processor(sales,settlements,options={}) {
        const feeBps=E.integer(options.feeBps??200,'Comisión',0,3000),retentionBps=E.integer(options.retentionBps??0,'Retención',0,1500);
        const settlementDays=E.integer(options.settlementDays??2,'Plazo de liquidación',0,30),asOf=E.date(options.asOf??'2026-06-30');
        const gross=movements(sales,'V'),paid=movements(settlements,'L');
        if([...gross,...paid].some(r=>r.date===null||r.amount<0))throw Error('Procesadoras: fecha requerida e importes no negativos');
        const breakdown=gross.map(r=>{
            const fee=rateAmount(r.amount,feeBps),retention=rateAmount(r.amount,retentionBps);
            const dueDate=new Date(Date.parse(r.date+'T00:00:00Z')+settlementDays*86400000).toISOString().slice(0,10);
            return {...r,gross:r.amount,fee,retention,net:E.sum([r.amount,-fee,-retention]),dueDate};
        });
        const active=breakdown.filter(r=>r.date<=asOf),destinations=paid.filter(r=>r.date<=asOf);
        const result=reconcile(active.map(r=>({...r,amount:r.net,date:r.dueDate})),destinations,{amountTolerance:options.amountTolerance??0,dayTolerance:options.dayTolerance??0,oneToMany:false}).map(r=>{
            if(r.status==='Solo en origen') {
                const due=active.filter(x=>r.originIds.includes(x.id)).every(x=>x.dueDate>asOf);
                return {...r,status:due?'Liquidación pendiente':'Liquidación vencida',reason:due?'Todavía dentro del plazo sintético.':'Plazo sintético vencido sin liquidación.'};
            }return r;
        });
        return {rows:result,breakdown,excluded:breakdown.filter(r=>r.date>asOf).length+paid.filter(r=>r.date>asOf).length};
    }
    const sales=E.group(E.baseline.accepted,'orderId');
    const op=(id,ref,date,amount)=>({id,ref,date,amount});
    const bankLeft=[op('ERP-1',sales[0].key,'2026-01-03',sales[0].sales),op('ERP-2',sales[1].key,'2026-01-06',sales[1].sales),op('ERP-3',sales[2].key,'2026-01-09',sales[2].sales),op('ERP-4','SIN-BANCO','2026-01-10',80000),op('ERP-5','DUP','2026-01-11',50000),op('ERP-6','DUP','2026-01-11',50000),op('ERP-7','LOTE-1','2026-01-12',60000),op('ERP-8','LOTE-1','2026-01-12',40000),op('ERP-9','AMB','2026-01-13',100000)];
    const bankRight=[op('BAN-1',sales[0].key,'2026-01-03',sales[0].sales),op('BAN-2',sales[1].key,'2026-01-06',sales[1].sales-1000),op('BAN-3',sales[2].key,'2026-01-11',sales[2].sales),op('BAN-4','SIN-GESTION','2026-01-10',20000),op('BAN-5','DUP','2026-01-11',50000),op('BAN-6','LOTE-1','2026-01-12',100000),op('BAN-7','AMB','2026-01-13',60000),op('BAN-8','AMB','2026-01-13',40000),op('BAN-9','AMB','2026-01-13',100000)];
    const accountingLeft=[op('GES-1','FAC-101','2026-01-03',sales[0].sales),op('GES-2','FAC-102','2026-01-06',sales[1].sales),op('GES-3','FAC-103','2026-01-09',sales[2].sales),op('GES-4','FAC-104','2026-01-12',70000)];
    const accountingRight=[{...accountingLeft[0],id:'ASI-1'}, {...accountingLeft[1],id:'ASI-2',amount:accountingLeft[1].amount-2000},op('ASI-3','FAC-105','2026-01-13',30000),op('ASI-4','FAC-DUP','2026-01-14',40000),op('ASI-5','FAC-DUP','2026-01-14',40000)];
    const cardSales=[op('VEN-1','CUP-11','2026-06-01',100000),op('VEN-2','CUP-12','2026-06-02',200000),op('VEN-3','CUP-13','2026-06-30',150000),op('VEN-4','CUP-14','2026-06-03',120000)];
    const cardPaid=[op('LIQ-1','CUP-11','2026-06-03',98000),op('LIQ-2','CUP-12','2026-06-04',190000),op('LIQ-3','CUP-14','2026-06-05',117600),op('LIQ-4','CUP-15','2026-06-06',75000)];
    const sample={bankLeft,bankRight,accountingLeft,accountingRight,cardSales,cardPaid};
    const api={rateAmount,percentBps,movements,reconcile,read,processor,sample};
    root.LGFinance=api;if(node)module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this);
