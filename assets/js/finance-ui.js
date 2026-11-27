(() => {
    'use strict';
    const root=document.querySelector('[data-demo]');if(!root||!['LG-001','LG-002','LG-009'].includes(root.dataset.demo))return;
    root.dataset.enhanced='true';
    const id=root.dataset.demo,F=globalThis.LGFinance,E=globalThis.LGCommercial,U=globalThis.LGDemoUI;
    const {esc,money,metrics,table,select,input,notice,csv}=U;
    const bank=id==='LG-001',card=id==='LG-009';
    const source=bank?[F.sample.bankLeft,F.sample.bankRight]:card?[F.sample.cardSales,F.sample.cardPaid]:[F.sample.accountingLeft,F.sample.accountingRight];
    const labels=bank?['Movimientos de gestión','Extracto bancario']:card?['Ventas declaradas brutas','Liquidaciones netas']:['Movimientos de gestión','Libro Mayor · cuenta 1.01.01'];
    const text=rows=>globalThis.LGPortfolioDemo.serializeCsv([['id','referencia','fecha','importe'],...rows.map(r=>[r.id,r.ref,r.date,r.amount])],';');
    const defaults={amountTolerance:0,dayTolerance:0,oneToMany:true,feeBps:200,retentionBps:0,settlementDays:2,asOf:'2026-06-30'};
    let options={...defaults},left=source[0],right=source[1],leftText=text(left),rightText=text(right),filter='Todos',query='',error='',result;
    const run=(l,r,o)=>card?F.processor(l,r,o):{rows:F.reconcile(l,r,o)};
    result=run(left,right,options);
    const filtered=()=>result.rows.filter(r=>(filter==='Todos'||r.status===filter)&&r.ref.toLowerCase().includes(query.toLowerCase()));
    function render() {
        const matched=result.rows.filter(r=>r.matched),originMatched=matched.reduce((n,r)=>n+r.originCount,0);
        root.innerHTML=notice(card?'Conciliación real de cupones y liquidaciones sintéticas. Comisión, retención y plazos son hipótesis configurables; no representan contratos de procesadoras.':bank?'Conciliación entre gestión y extracto bancario. Tres referencias reutilizan documentos del dataset comercial; los demás movimientos son escenarios sintéticos independientes.':'Conciliación de gestión contra la cuenta de control Clientes (1.01.01) del Libro Mayor. Los asientos se muestran con contrapartida; el cruce usa solo la cuenta de control, sin sumar ambas patas.')+
            `<details class="demo-inputs"><summary>Consultar y editar ${card?'ventas / liquidaciones':'movimientos'} sintéticos</summary><p>CSV con encabezado id;referencia;fecha;importe, fechas AAAA-MM-DD e importes PYG enteros firmados. Se conserva el formato anterior referencia;importe (sin control de fechas); en procesadoras la fecha es obligatoria. Máximo 1 MiB combinado y 20.000 registros por conjunto.</p><div class="demo-input-grid">${['left','right'].map((key,i)=>`<label for="${key}-data">${labels[i]}<textarea id="${key}-data" class="demo-textarea" spellcheck="false">${esc(i?rightText:leftText)}</textarea></label>`).join('')}</div><button data-action="process">Procesar movimientos</button></details>`+
            `<div class="demo-controls">${input('amount-tolerance','Tolerancia PYG',options.amountTolerance,'number','min="0" max="1000000" step="1"')}${input('day-tolerance','Tolerancia días',options.dayTolerance,'number','min="0" max="30" step="1"')}${card?input('fee-input','Comisión sintética %',(options.feeBps/100).toFixed(2),'number','min="0" max="30" step="0.01"')+input('retention-input','Retención sintética %',(options.retentionBps/100).toFixed(2),'number','min="0" max="15" step="0.01"')+input('settlement-days','Plazo (días calendario)',options.settlementDays,'number','min="0" max="30" step="1"')+input('as-of','Fecha de corte',options.asOf,'date'):select('one-many','Uno a varios',[['si','Activado'],['no','Desactivado']],options.oneToMany?'si':'no')}<button data-action="apply">Aplicar parámetros</button><button data-action="reset">Restablecer ejemplo</button></div>`+
            metrics([['Filas origen / destino',`${left.length} / ${right.length}`],['Grupos conciliados',matched.length],['Origen conciliado',`${originMatched} / ${left.length}`],['Grupos con excepción',result.rows.length-matched.length]])+
            `<div class="demo-controls">${select('status-filter','Estado',['Todos',...new Set(result.rows.map(r=>r.status))],filter)}${input('reference-filter','Referencia contiene',query,'search')}<button data-action="export-reconciliation">Descargar resultados filtrados</button></div>`+
            table(['Referencia',card?'Neto esperado PYG':labels[0]+' PYG',labels[1]+' PYG','Diferencia PYG','Días diferencia','Filas O / D','Estado','Detalle'],filtered().map(r=>[r.ref,r.origin,r.destination,r.difference,r.dayGap,`${r.originCount} / ${r.destinationCount}`,r.status,r.reason]))+
            (card?`<h3>Desglose de ventas declaradas</h3>${table(['Cupón','Venta','Plazo hasta','Bruto PYG','Comisión PYG','Retención PYG','Neto esperado PYG'],result.breakdown.map(r=>[r.ref,r.date,r.dueDate,r.gross,r.fee,r.retention,r.net]))}<p class="demo-small">Fuera del corte: ${result.excluded} filas, conservadas en los orígenes. Redondeo individual a guaraní por comisión y retención; neto = bruto − comisión − retención. El plazo usa días calendario, sin feriados ni reglas fiscales reales.</p>`:'')+
            (!bank&&!card?`<details class="demo-inputs"><summary>Asientos sintéticos del Libro Mayor</summary><p>Cada registro de la cuenta de control se representa con contrapartida en Ventas (4.01.01). Un asiento balanceado puede estar duplicado o diferir de gestión; balancear no equivale a conciliar.</p>${table(['Asiento','Documento','Fecha','Cuenta','Debe PYG','Haber PYG'],right.flatMap(r=>[[r.id,r.ref,r.date,'1.01.01',Math.max(0,r.amount),Math.max(0,-r.amount)],[r.id,r.ref,r.date,'4.01.01',Math.max(0,-r.amount),Math.max(0,r.amount)]]))}</details>`:'')+
            `<details class="demo-inputs"><summary>Reglas y escenarios conocidos</summary><p>Se normaliza referencia con trim y mayúsculas. El cruce exige referencia igual; no utiliza similitud de texto. Duplicados exactos o IDs repetidos se apartan. Una diferencia de importe o fecha fuera de tolerancia requiere revisión. Los faltantes se conservan. Cada fila se consume una vez.</p><p>Uno a varios solo con una contraparte única, hasta diez candidatos y una sola combinación de importes/fechas. Dos combinaciones posibles, muchos a muchos o un límite excedido se marcan Ambiguo. No se empareja automáticamente una referencia duplicada exacta. Los CSV sin fecha conservan la limitación visible.</p><p>${card?'Con comisión 2%, retención 0% y plazo 2 días: CUP-11 y CUP-14 concilian; CUP-12 tiene diferencia; CUP-13 está pendiente al 30/06 y vence al 02/07; CUP-15 carece de venta.':bank?'LOTE-1: 60.000 + 40.000 = 100.000, combinación única. AMB: 60.000 + 40.000 y 100.000 compiten por la misma contraparte. DUP: duplicado exacto; no se concilia.':'FAC-101 coincide; FAC-102 difiere en 2.000 PYG; FAC-103/104 están pendientes; FAC-105 solo figura en el Mayor; FAC-DUP es duplicado.'}</p><p>Arquitectura productiva: ingestión autorizada → staging → normalización monetaria → motor de reglas versionadas → revisión de excepciones → auditoría persistente. Esta demo no modifica bancos, asientos ni ventas y no reemplaza una revisión financiera.</p></details>`+
            `<p id="demo-message" role="status" aria-live="polite" class="demo-message${error?' error':''}">${esc(error||'Resultados calculados localmente. Diferencias = origen − destino; importes faltantes permanecen vacíos.')}</p>`;
    }
    root.addEventListener('input',e=>{if(e.target.id==='left-data')leftText=e.target.value;if(e.target.id==='right-data')rightText=e.target.value;});
    root.addEventListener('change',e=>{
        if(e.target.id==='status-filter')filter=e.target.value;
        else if(e.target.id==='reference-filter')query=e.target.value;
        else return;render();
    });
    root.addEventListener('click',e=>{
        const action=e.target.closest('[data-action]')?.dataset.action;if(!action)return;
        try {
            if(action==='reset'){options={...defaults};left=source[0];right=source[1];leftText=text(left);rightText=text(right);filter='Todos';query='';result=run(left,right,options);}
            if(action==='process') {
                if(new TextEncoder().encode(leftText+rightText).length>1048576)throw Error('Máximo 1 MiB combinado');
                const l=F.read(leftText),r=F.read(rightText),next=run(l,r,options);left=l;right=r;result=next;filter='Todos';
            }
            if(action==='apply') {
                const nextOptions={...options,amountTolerance:E.integer(root.querySelector('#amount-tolerance').value,'Tolerancia PYG',0,1000000),dayTolerance:E.integer(root.querySelector('#day-tolerance').value,'Tolerancia días',0,30),oneToMany:card?false:root.querySelector('#one-many').value==='si'};
                if(card)Object.assign(nextOptions,{feeBps:F.percentBps(root.querySelector('#fee-input').value,3000),retentionBps:F.percentBps(root.querySelector('#retention-input').value,1500),settlementDays:E.integer(root.querySelector('#settlement-days').value,'Plazo',0,30),asOf:root.querySelector('#as-of').value});
                const next=run(left,right,nextOptions);options=nextOptions;result=next;filter='Todos';
            }
            if(action==='export-reconciliation')csv([['referencia','origen_pyg','destino_pyg','diferencia_pyg','dias','estado','ids_origen','ids_destino','fechas_origen','fechas_destino','detalle'],...filtered().map(r=>[r.ref,r.origin,r.destination,r.difference,r.dayGap,r.status,r.originIds.join('|'),r.destinationIds.join('|'),r.originDates.join('|'),r.destinationDates.join('|'),r.reason])],`${id.toLowerCase()}-resultado.csv`);
            error='';render();
        }catch(err){error=err.message+' Se conserva el último resultado y parámetros válidos.';render();}
    });
    render();
})();
