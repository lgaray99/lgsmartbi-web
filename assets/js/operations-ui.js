(() => {
    'use strict';
    const root=document.querySelector('[data-demo]');if(!root||!['LG-003','LG-004','LG-008','LG-011'].includes(root.dataset.demo))return;
    root.dataset.enhanced='true';
    const id=root.dataset.demo,O=globalThis.LGOperations,E=globalThis.LGCommercial,U=globalThis.LGDemoUI;
    const {esc,metrics,table,input,select,notice,csv}=U;
    let state=id==='LG-003'?O.rpaInitial():O.monitorInitial(),retries=1,error='';
    const inventory={product:'P002',qty:20,mode:'Producto único',productionText:'[{"productId":"P002","qty":20}]',recipeText:JSON.stringify(O.bom.recipes,null,2),movementText:JSON.stringify(O.bom.movements,null,2),result:O.materialPlan([{productId:'P002',qty:20}])};
    const historyDefaults={from:'2026-06-01',to:'2026-06-10',job:'',status:'',sla:90};
    let history={...historyDefaults},summary=O.executionSummary(history);
    function renderInventory() {
        const r=inventory.result;
        root.innerHTML=notice('Explosión BOM funcional con productos de DemoComercial S.A. Consumo teórico frente a movimientos y stock sintéticos. El escenario base registra 20 chipás; al cambiar producción, los movimientos conservan esa referencia hasta editarlos.')+
            `<div class="demo-controls">${select('production-mode','Entrada de producción',['Producto único','Lote JSON'],inventory.mode)}${select('bom-product','Producto',Object.keys(O.bom.recipes).map(key=>[key,E.data.products.find(p=>p.id===key)?.name||key]),inventory.product)}${input('units-input','Unidades a fabricar',inventory.qty,'number','min="0" max="100000" step="1"')}<button data-action="bom-calc">Calcular materiales</button><button data-action="reset">Restablecer</button><button data-action="export-bom">Descargar comparación</button></div>`+
            metrics([['Materiales',r.length],['Con faltantes de stock',r.filter(x=>x.shortage>0).length],['Con diferencia de consumo',r.filter(x=>x.difference!==null&&x.difference!==0).length],['Tipo de consumo','Teórico']])+
            table(['Material','Requerido','Registrado','Diferencia real − teórico','Stock sintético','Faltante','Unidad'],r.map(x=>[x.name,x.required,x.recorded,x.difference,x.available,x.shortage,x.unit]))+
            `<details class="demo-inputs"><summary>Editar producción, recetas y movimientos JSON</summary><label for="production-data">Producción (se utiliza al elegir Lote JSON)</label><textarea id="production-data" class="demo-textarea">${esc(inventory.productionText)}</textarea><label for="recipe-data">Recetas por producto (consumo por unidad producida)</label><textarea id="recipe-data" class="demo-textarea">${esc(inventory.recipeText)}</textarea><label for="movement-data">Consumos registrados sintéticos</label><textarea id="movement-data" class="demo-textarea">${esc(inventory.movementText)}</textarea></details>`+
            `<details class="demo-inputs"><summary>Recetas, unidades y controles</summary><p>Pan integral: 300 g harina + 180 ml agua + empaque. Chipá: 230 g harina + 80 g queso + empaque. Budín: 200 g harina + 100 g azúcar + huevo + empaque. Combo: 1 pan + 2 chipás individualmente empacados + caja exterior. El consumo de cada componente se expande y luego se agrega por material, sin sumar nuevamente los subproductos como materias primas.</p><p>Base exacta: gramos, mililitros y piezas enteras. Se convierten kg↔g y l↔ml; se rechaza masa↔volumen, piezas fraccionarias, unidades desconocidas y cantidades fuera de rango. Se controlan ciclos, componentes duplicados y producción duplicada. Producción de combo y subproductos agregada manualmente representa órdenes independientes, no una segunda expansión de la misma orden.</p><p>Stock, recetas y consumos son sintéticos; no incluye mermas, rendimientos ni reserva real. Los costos comerciales de LG-007 son costos unitarios históricos, no valorización calculada de este BOM. Un material sin movimiento queda con registrado y diferencia vacíos.</p></details><p id="demo-message" role="status" aria-live="polite" class="demo-message${error?' error':''}">${esc(error||'Unidades y grafo de recetas validados antes de actualizar los resultados.')}</p>`;
    }
    function renderHistory() {
        const s=summary,headers=['Ejecución','Proceso','Inicio UTC','Duración s','Estado','Intentos','Error sintético'];
        root.innerHTML=notice('Tablero funcional sobre 30 ejecuciones sintéticas deterministas. Duraciones e incidentes pertenecen al dataset de ejemplo; no se leen tareas del sistema ni se envían alertas.')+
            `<div class="demo-controls">${input('run-from','Desde',history.from,'date')}${input('run-to','Hasta',history.to,'date')}${select('job-filter','Proceso',[['','Todos'],...new Set(O.runs.map(r=>r.job))],history.job)}${select('run-status','Estado',[['','Todos'],'Completado','Recuperado','Fallido'],history.status)}${input('sla-input','SLA máximo (segundos)',history.sla,'number','min="1" max="3600" step="1"')}<button data-action="history-apply">Aplicar filtros / SLA</button><button data-action="reset">Restablecer</button><button data-action="export-history">Descargar historial filtrado</button></div>`+
            metrics([['Ejecuciones',s.count],['Correctas / fallidas',`${s.success} / ${s.failed}`],['Duración media (s)',s.average===null?'—':s.average.toFixed(1)],['Reintentos',s.retries],['Cumplen SLA',s.compliant],['Cumplimiento',s.slaRate===null?'—':(s.slaRate*100).toFixed(1)+'%']])+
            table(headers,s.rows.map(r=>[r.id,r.job,r.startedAt,r.duration,r.status,r.attempts,r.error]))+
            `<details class="demo-inputs"><summary>Historial de intentos y reglas del indicador</summary><p>Correctas: Completado o Recuperado. Cumple SLA: ejecución correcta y duración total ≤ umbral. Una fallida incumple aunque dure poco. Denominador: todas las ejecuciones filtradas. Reintentos = suma(intentos − 1). La media incluye duración total de todas las ejecuciones filtradas; sin filas, ratios vacíos.</p>${table(['Ejecución','Intento','Estado de intento','Detalle'],s.rows.flatMap(r=>Array.from({length:r.attempts},(_,i)=>[r.id,i+1,i<r.attempts-1||r.status==='Fallido'?'Fallido':'Completado',i<r.attempts-1?'Fallo sintético previo':r.error||'Sin error'])))}<p>Arquitectura productiva: logs estructurados → almacenamiento de eventos → correlación por run_id → métricas y umbrales → gestión de incidentes autorizada. El tablero actual no supervisa ni reejecuta trabajos externos.</p></details><p id="demo-message" role="status" aria-live="polite" class="demo-message${error?' error':''}">${esc(error||'Historial, métricas y filtros calculados desde el mismo conjunto.')}</p>`;
    }
    function render() {
        if(id==='LG-008'){renderInventory();return;}
        if(id==='LG-011'){renderHistory();return;}
        const rpa=id==='LG-003';
        const rows=rpa?state.tasks:state.queue;
        root.innerHTML=notice(rpa?'Motor de simulación determinista de una cola RPA. Los cambios de estado, fallos y reintentos se ejecutan en JavaScript. No abre ERP ni ejecuta Python; los archivos de resultado son nombres ilustrativos.':'Motor de eventos de archivos sintéticos, con detección por firma, cola, reintentos y estado materializado en memoria. No observa directorios, no lee Parquet y no borra archivos del equipo.')+
            `<div class="demo-controls">${input('max-retries','Máximo de reintentos',retries,'number','min="0" max="3" step="1"')}${rpa?'<button data-action="ops-step">Ejecutar siguiente etapa</button><button data-action="ops-run">Procesar cola completa</button>':`<button data-action="detect"${state.eventIndex>=O.events.length?' disabled':''}>Detectar siguiente evento</button><button data-action="ops-step">Procesar siguiente trabajo</button><button data-action="ops-run">Vaciar cola actual</button>`}<button data-action="reset">Reiniciar</button><button data-action="export-operations">Descargar actividad</button></div>`+
            metrics([['Tareas / eventos detectados',rpa?rows.length:state.eventIndex],['Completados',rows.filter(r=>r.status==='Completado').length],['Errores finales',rows.filter(r=>['Fallido','Error'].includes(r.status)).length],['Pendientes / reintentos',rows.filter(r=>['En cola','Ejecutando','Reintento'].includes(r.status)).length]])+
            (rpa?table(['Tarea','Reporte','Estado','Etapa','Intentos','Error','Resultado'],rows.map(r=>[r.id,r.report,r.status,O.stages[r.stage]||'Finalizado',r.attempts,r.error,r.output])):
                table(['Trabajo','Archivo','Evento','Firma sintética','Estado','Intentos','Detalle'],rows.map(r=>[r.id,r.name,r.kind,r.signature,r.status,r.attempts,r.detail]))+
                `<h3>Materializado confirmado en memoria</h3>${table(['Archivo','Firma','Filas sintéticas'],state.committed.map(r=>[r.name,r.signature,r.rows]))}<p class="demo-small">Eventos sin cambio ignorados: ${state.ignored}. Un error conserva el último materializado válido. Las bajas solo afectan esta tabla en memoria.</p>`)+
            `<details class="demo-inputs"><summary>Escenarios y arquitectura productiva</summary><p>${rpa?'T-001 completa en el primer intento. T-002 falla una vez y se recupera si se permite un reintento. T-003 tiene error permanente; termina fallido tras 1 + máximo de reintentos. Cada intento recorre apertura, obtención, validación y registro.':'Secuencia fija: alta ventas v1 → evento idéntico → modificación v2 con error transitorio → alta stock → baja ventas → baja idéntica → stock v2 inválido → alta costos. Procesar entre eventos permite observar cada transición. Un cambio pendiente reemplazado se marca Obsoleto; un evento idéntico no crea un trabajo extra.'}</p><p>${rpa?'Implementación real: programador → robot Python con selectores estables → validación de esquema → almacenamiento → logs persistentes y secretos fuera del código.':'Implementación real: eventos del sistema de archivos o sondeo → hash estable → cola persistente → validación y lectura Parquet en Python → escritura atómica de derivados y checkpoint tras confirmar la salida.'}</p><p>Reloj de actividad T+ en tiempo modelado (250 ms por evento), no duración medida de un ERP o proceso Python. Avance manual y sin persistencia; recargar reinicia.</p></details><pre class="demo-log">${esc(state.log.map(r=>`[${r.time}] ${r.entity}: ${r.message}`).join('\n')||'Sin actividad. Iniciá el escenario sintético.')}</pre><p id="demo-message" role="status" aria-live="polite" class="demo-message${error?' error':''}">${esc(error||'Estado calculado por el motor de simulación.')}</p>`;
    }
    root.addEventListener('click',event=>{
        const action=event.target.closest('[data-action]')?.dataset.action;if(!action)return;
        try {
            if(id==='LG-008') {
                if(action==='reset')Object.assign(inventory,{product:'P002',qty:20,mode:'Producto único',productionText:'[{"productId":"P002","qty":20}]',recipeText:JSON.stringify(O.bom.recipes,null,2),movementText:JSON.stringify(O.bom.movements,null,2),result:O.materialPlan([{productId:'P002',qty:20}])});
                if(action==='bom-calc') {
                    const product=root.querySelector('#bom-product').value,qty=E.integer(root.querySelector('#units-input').value,'Producción',0,100000),mode=root.querySelector('#production-mode').value;
                    if(new TextEncoder().encode(inventory.productionText+inventory.recipeText+inventory.movementText).length>1048576)throw Error('Máximo 1 MiB de JSON');
                    const production=mode==='Lote JSON'?JSON.parse(inventory.productionText):[{productId:product,qty}];
                    const next=O.materialPlan(production,JSON.parse(inventory.recipeText),JSON.parse(inventory.movementText));
                    Object.assign(inventory,{product,qty,mode,result:next});
                }
                if(action==='export-bom')csv([['material','teorico','registrado','diferencia','stock','faltante','unidad'],...inventory.result.map(r=>[r.name,r.required,r.recorded,r.difference,r.available,r.shortage,r.unit])],'lg-008-consumo.csv');
                error='';render();return;
            }
            if(id==='LG-011') {
                if(action==='reset'){history={...historyDefaults};summary=O.executionSummary(history);}
                if(action==='history-apply') {
                    const next={from:root.querySelector('#run-from').value,to:root.querySelector('#run-to').value,job:root.querySelector('#job-filter').value,status:root.querySelector('#run-status').value,sla:root.querySelector('#sla-input').value};
                    const analyzed=O.executionSummary(next);history=next;summary=analyzed;
                }
                if(action==='export-history')csv([['ejecucion','proceso','inicio_utc','duracion_s','estado','intentos','error'],...summary.rows.map(r=>[r.id,r.job,r.startedAt,r.duration,r.status,r.attempts,r.error])],'lg-011-historial.csv');
                error='';render();return;
            }
            const nextRetries=action==='reset'?1:E.integer(root.querySelector('#max-retries').value,'Reintentos',0,3);
            let next=state;
            if(action==='reset')next=id==='LG-003'?O.rpaInitial():O.monitorInitial();
            if(action==='detect')next=O.detectNext(state);
            if(action==='ops-step')next=id==='LG-003'?O.rpaStep(state,nextRetries):O.processMonitor(state,nextRetries);
            if(action==='ops-run') {
                if(id==='LG-003')next=O.rpaRun(state,nextRetries);
                else for(let i=0;i<100&&next.queue.some(r=>['En cola','Reintento'].includes(r.status));i++)next=O.processMonitor(next,nextRetries);
            }
            if(action==='export-operations')csv([['secuencia','reloj_modelado','entidad','evento'],...state.log.map(r=>[r.sequence,r.time,r.entity,r.message])],`${id.toLowerCase()}-actividad.csv`);
            state=next;retries=nextRetries;error='';render();
        }catch(e){error=e.message+' Se conserva el último estado válido.';render();}
    });
    root.addEventListener('input',event=>{
        const fields={'production-data':'productionText','recipe-data':'recipeText','movement-data':'movementText'};
        if(fields[event.target.id])inventory[fields[event.target.id]]=event.target.value;
    });
    render();
})();
