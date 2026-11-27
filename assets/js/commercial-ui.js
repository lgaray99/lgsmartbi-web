/* Analítica comercial calculada en el navegador; no es Power BI Service. */
(() => {
    'use strict';
    const root=document.querySelector('[data-demo]');if(!root||!['LG-005','LG-006','LG-007','LG-010'].includes(root.dataset.demo))return;
    const id=root.dataset.demo;
    root.dataset.enhanced='true';
    const E=globalThis.LGCommercial,D=E.data,U=globalThis.LGDemoUI;
    const {esc,money,metrics,table,select,input,notice,csv}=U;
    const defaults={from:'2026-01-01',to:'2026-06-30',branchId:'',category:'',productId:'',customerId:''};
    let filters={...defaults},result=E.analyze(filters),error='';
    const pipeline={text:JSON.stringify(D.raw,null,2),snapshot:[...E.baseline.accepted],result:E.baseline,mode:'Completa',elapsed:null,stats:null,
        legacyText:JSON.stringify(globalThis.LGPortfolioDemo.sample.etlRaw,null,2),legacy:null};
    let dimension='facts',grouping='branchId',question=0;
    const name=(dim,id)=>dim.find(x=>x.id===id)?.name??id;
    const detailHeaders=['id','documento','fecha','sucursal','cliente','producto','cantidad','precio_pyg','costo_unitario_pyg','ventas_pyg','costos_pyg','margen_pyg'];
    const detailRows=rows=>rows.map(r=>[r.id,r.orderId,r.date,name(D.branches,r.branchId),name(D.customers,r.customerId),name(D.products,r.productId),r.qty,r.price,r.cost,r.sales,r.costs,r.sales-r.costs]);
    function bars(items,label) {
        const max=Math.max(1,...items.map(r=>r.sales));
        return `<figure class="analytics-chart"><figcaption>${esc(label)}</figcaption><svg viewBox="0 0 680 190" role="img" aria-label="${esc(label)}; cifras exactas en la tabla siguiente">${items.map((r,i)=>{
            const w=640/Math.max(1,items.length),x=20+i*w,h=r.sales/max*130;
            return `<g><title>${esc(r.key)}: ${esc(money(r.sales))}</title><rect x="${x+4}" y="${150-h}" width="${Math.max(1,w-8)}" height="${h}" rx="3" fill="#39A9DB"/><text x="${x+w/2}" y="173" text-anchor="middle">${esc(r.key)}</text></g>`;
        }).join('')}</svg></figure>`;
    }
    function renderBI() {
        const focus=document.activeElement?.id;
        root.innerHTML=notice('Dashboard funcional en JavaScript. Datos sintéticos de DemoComercial S.A., enero–junio 2026. No es un informe Power BI ni una conexión empresarial. Todos los KPIs se recalculan desde las mismas líneas válidas de LG-005.')+
            `<div class="demo-controls">${input('date-from','Desde',filters.from,'date')}${input('date-to','Hasta',filters.to,'date')}${select('branch-filter','Sucursal',[['','Todas'],...D.branches.map(x=>[x.id,x.name])],filters.branchId)}${select('category-filter','Categoría',[['','Todas'],...new Set(D.products.map(x=>x.category))],filters.category)}${select('product-filter','Producto',[['','Todos'],...D.products.map(x=>[x.id,x.name])],filters.productId)}${select('customer-filter','Cliente',[['','Todos'],...D.customers.map(x=>[x.id,x.name])],filters.customerId)}<button data-action="reset">Restablecer</button><button data-action="export-sales">Descargar detalle filtrado</button></div>`+
            metrics([['Ventas',money(result.sales)],['Costos',money(result.costs)],['Margen bruto',money(result.margin)],['Margen %',result.marginRate==null?'—':(100*result.marginRate).toFixed(2)+'%'],['Cantidad vendida',result.quantity],['Ticket promedio',money(result.ticket)],['Clientes / productos',`${result.customers} / ${result.products}`],['Documentos / líneas',`${result.invoices} / ${result.count}`]])+
            `<p class="demo-small">Control automático: ventas = costos + margen; sumas por mes, sucursal y categoría verificadas. Ticket = ventas / documentos distintos del contexto filtrado (redondeado a PYG). No sumar tickets ni contar documentos como líneas.</p>`+
            bars(result.monthly,'Evolución de ventas por mes')+table(['Mes','Ventas PYG','Costos PYG','Margen PYG','Unidades'],result.monthly.map(r=>[r.key,r.sales,r.costs,r.margin,r.quantity]))+
            `<div class="analytics-grid"><section><h3>Sucursales</h3>${table(['Sucursal','Ventas PYG','Margen PYG'],result.branches.map(r=>[name(D.branches,r.key),r.sales,r.margin]))}</section><section><h3>Categorías</h3>${table(['Categoría','Ventas PYG','Margen PYG'],result.categories.map(r=>[r.key,r.sales,r.margin]))}</section></div>`+
            `<details class="demo-inputs"><summary>Registros filtrados (${result.rows.length}) y reglas</summary><p>Grano: una línea por documento y producto. Se excluyen anulados y entradas inválidas; no incluye IVA, devoluciones ni descuentos. Margen bruto = ventas − costo registrado. Cantidad en unidades comerciales del producto; no equivale a kg ni litros.</p>${table(detailHeaders,detailRows(result.rows))}</details>`+
            `<details class="demo-inputs"><summary>Arquitectura real de Power BI y reproducción local</summary><div class="architecture"><span>Orígenes</span>→<span>Power Query</span>→<span>Estrella Import</span>→<span>Medidas DAX</span>→<span>Informe</span></div><p>Hechos: líneas de venta. Dimensiones: Fecha (calendario continuo), Producto (incluye categoría), Cliente y Sucursal. Relaciones 1:* con filtro unidireccional desde las dimensiones. IDs como texto y moneda como entero; sin relaciones muchos a muchos.</p><p>Power Query normaliza tipos y controla rechazos. Para producción: actualización programada, gateway si el origen es local, controles de integridad, RLS y monitoreo. La carga incremental de LG-005 ejecuta reglas en memoria; aquí no existe actualización de Power BI Service.</p><p><a href="../downloads/modelo-powerbi.md" download>Guía reproducible Power BI</a> · <a href="../downloads/medidas.dax" download>Ejemplos DAX</a> · <a href="../downloads/ventas.csv" download>Hechos CSV</a> · <a href="data-warehouse-comercial.html#demostracion">Explorar Data Warehouse</a></p><p>No se ha creado ni validado un archivo PBIX/PBIP. Los ejemplos DAX y Power Query requieren validación en Power BI Desktop.</p></details>`+
            `<p id="demo-message" role="status" aria-live="polite" class="demo-message${error?' error':''}">${esc(error||'Indicadores y filtros verificados contra los registros.')}</p>`;
        if(focus)document.getElementById(focus)?.focus();
    }
    const rawHeaders=['Fila','ID original','Origen','Fecha','Cantidad original','Precio original','Estado original'];
    const rawRows=rows=>rows.map((r,i)=>[i+1,r?.id,r?.source,r?.date,r?.qty,r?.price,r?.status]);
    function controls() {
        return `<div class="demo-controls">${input('date-from','Desde',filters.from,'date')}${input('date-to','Hasta',filters.to,'date')}${select('branch-filter','Sucursal',[['','Todas'],...D.branches.map(x=>[x.id,x.name])],filters.branchId)}<button data-action="reset">Restablecer</button></div>`;
    }
    function renderPipeline() {
        const r=pipeline.result;
        root.innerHTML=notice('ETL real en JavaScript sobre orígenes ERP y tienda sintéticos. El estado cargado vive solo en esta pestaña; no existe movimiento entre servidores. BI y DW usan la misma versión base reproducible.')+
            `<div class="demo-controls">${select('load-mode','Modo de carga',['Completa','Incremental'],pipeline.mode)}<button data-action="run-etl">Ejecutar transformación y carga</button><button data-action="incremental-sample">Preparar lote incremental conocido</button><button data-action="reset">Restablecer</button><button data-action="export-etl">Descargar auditoría</button><button data-action="export-loaded">Descargar hechos CSV</button><button data-action="export-loaded-json">Descargar snapshot JSON</button></div>`+
            metrics([['Entradas del último lote',r.accepted.length+r.rejected.length+(pipeline.stats?.unchanged||0)+(pipeline.stats?.stale||0)],['Aceptados del lote',r.accepted.length],['Rechazados',r.rejected.length],['Filas cargadas',pipeline.snapshot.length],['Ventas cargadas',money(E.aggregate(pipeline.snapshot).sales)],['Insertados / actualizados',pipeline.stats?`${pipeline.stats.inserted} / ${pipeline.stats.updated}`:'Carga completa'],['Sin cambio / antiguas',pipeline.stats?`${pipeline.stats.unchanged} / ${pipeline.stats.stale}`:'—'],['Tiempo real (ms)',pipeline.elapsed==null?'Sin ejecutar':pipeline.elapsed.toFixed(2)]])+
            `<details class="demo-inputs"><summary>Editar datos de origen JSON</summary><p>Campos comerciales: id, orderId, date, branchId, customerId, productId, qty, price, cost, status, source, updatedAt. IDs como texto; importes PYG enteros; versiones UTC. Hasta 1 MiB y 20.000 registros.</p><label for="etl-data">Lote sintético</label><textarea id="etl-data" class="demo-textarea" spellcheck="false">${esc(pipeline.text)}</textarea></details>`+
            `<details class="demo-inputs"><summary>Consultar origen base (${D.raw.length} filas, sin alterarlo)</summary>${table(rawHeaders,rawRows(D.raw))}<a href="../downloads/origen-ventas.json" download>Descargar origen JSON</a></details>`+
            `<h3>Registros procesados / transformados del último lote</h3>${table(detailHeaders,detailRows(r.accepted))}<h3>Registros inválidos y duplicados</h3>${table(['Fila original','ID','Valor original','Motivo'],r.rejected.map(x=>[x.index,x.raw?.id,JSON.stringify(x.raw),x.reason]))}`+
            `<details class="demo-inputs"><summary>Reglas, comparación e incremental</summary><p>Se recortan IDs, se convierte estado a mayúsculas y se tipan cantidades, precio y costo. Solo OK; cantidad entera positiva, precio/costo no negativos. Se validan fechas reales, claves dimensionales y documentos consistentes; duplicados de ID dentro del lote se rechazan. Cada entrada recibe un resultado auditable.</p><p>Completa reemplaza el snapshot local con los aceptados. Incremental hace upsert por ID y updatedAt UTC: inserta nuevos, actualiza versiones posteriores, ignora versiones antiguas, omite idénticas y rechaza contenido distinto con igual versión. El lote de ejemplo actualiza una línea e inserta otra; repetirlo no duplica datos. Anulados se rechazan: no se simula su eliminación ni un CDC productivo. Un JSON inválido no cambia el snapshot.</p><p>Los cambios de este escenario no alteran el dataset base de otras páginas. Exportá los cargados para reproducirlo. <a href="data-warehouse-comercial.html#demostracion">Continuar al modelo estrella</a></p></details>`+
            `<details class="demo-inputs"><summary>Compatibilidad: transformación simple anterior (id, qty, price, status)</summary><label for="legacy-etl-data">Lote simple JSON sintético</label><textarea id="legacy-etl-data" class="demo-textarea">${esc(pipeline.legacyText)}</textarea><button data-action="legacy-etl">Transformar lote simple</button>${pipeline.legacy?table(['ID','Importe PYG','Resultado'],[...pipeline.legacy.accepted.map(x=>[x.id,x.amount,'Aceptado']),...pipeline.legacy.rejected.map(x=>[x.id,'',x.reason])]):''}<p>Motor anterior conservado. Este formato no aporta las dimensiones necesarias para BI/DW.</p></details>`+
            `<p id="demo-message" role="status" aria-live="polite" class="demo-message${error?' error':''}">${esc(error||'Snapshot base: 84 filas válidas; 17 rechazos conservados.')}</p>`;
    }
    function renderWarehouse() {
        const warehouse=E.warehouse(),a=E.analyze(filters),rows=dimension==='facts'?a.rows:warehouse[dimension];
        const dimHeaders=dimension==='facts'?detailHeaders:Object.keys(rows[0]||{});
        const dimRows=dimension==='facts'?detailRows(rows):rows.map(r=>dimHeaders.map(k=>r[k]));
        const grouped=E.group(a.rows,grouping==='month'?r=>r.date.slice(0,7):grouping==='category'?r=>name(D.products,r.productId)+' · '+D.products.find(p=>p.id===r.productId).category:grouping);
        root.innerHTML=notice('Modelo estrella real en memoria con los 84 hechos válidos de LG-005. Las consultas del navegador se ejecutan con JavaScript; el script descargable reproduce las tablas en PostgreSQL sin conexión del sitio a una base.')+
            controls()+metrics([['Origen operativo',D.raw.length+' filas'],['Hechos filtrados',a.count],['Ventas analíticas',money(a.sales)],['Integridad referencial','Sin huérfanos']])+
            `<div class="star-schema" aria-label="Modelo estrella con cuatro relaciones uno a muchos"><div>Fecha · 365 claves</div><div>Producto · 6 claves</div><strong>Hecho Venta · 84 líneas<br>FK fecha, producto, cliente, sucursal</strong><div>Cliente · 6 claves</div><div>Sucursal · 3 claves</div></div><p class="demo-small">Cada dimensión → Hecho Venta: 1:*, filtro unidireccional. PK de hecho: id de línea. PK dimensionales: fecha o id. Categoría es atributo de Producto; documento es una dimensión degenerada del hecho.</p>`+
            `<div class="demo-controls">${select('dimension-filter','Explorar tabla',[['facts','Hecho Venta'],['products','Producto'],['customers','Cliente'],['branches','Sucursal'],['dates','Fecha']],dimension)}${select('group-filter','Agrupar consulta',[['branchId','Sucursal'],['month','Mes'],['productId','Producto'],['customerId','Cliente']],grouping)}<button data-action="export-query">Descargar consulta</button></div><h3>Consulta analítica</h3>`+
            table(['Grupo','Ventas PYG','Costos PYG','Margen PYG','Unidades','Documentos distintos'],grouped.map(r=>[name(grouping==='branchId'?D.branches:grouping==='productId'?D.products:D.customers,r.key),r.sales,r.costs,r.margin,r.quantity,r.invoices]))+`<p class="demo-small">Documentos distintos se calcula por grupo: no sumar ese indicador entre productos que pertenecen al mismo documento.</p>`+
            `<details class="demo-inputs" open><summary>Tabla seleccionada: ${esc(dimension)} (${rows.length} registros)</summary><p>Los filtros afectan hechos y consultas. Las dimensiones mantienen su catálogo completo para inspeccionar todas sus claves.</p>${table(dimHeaders,dimRows)}</details>`+
            `<details class="demo-inputs"><summary>Operativo frente a analítico</summary><p>Origen: 101 filas con estados, strings y anomalías. ETL: 84 aceptadas y 17 rechazadas. Estrella: 84 hechos con claves validadas y medidas enteras. Ventas sin filtros: Gs. 5.017.000; costos: Gs. 2.993.000; margen: Gs. 2.024.000. No se agregan documentos contándolos por línea ni se ocultan los rechazados.</p>${table(rawHeaders,rawRows(D.raw.slice(0,8)))}</details>`+
            `<details class="demo-inputs"><summary>SQL PostgreSQL, CSV y reproducción</summary><pre class="demo-log">SELECT s.nombre, SUM(v.ventas_pyg) AS ventas_pyg,
       SUM(v.ventas_pyg - v.costos_pyg) AS margen_pyg,
       COUNT(DISTINCT v.documento) AS documentos
FROM demo_comercial.ventas v
JOIN demo_comercial.sucursales s ON s.id = v.sucursal_id
GROUP BY s.nombre ORDER BY s.nombre;</pre><p>Usar una base local vacía de demostración. El script crea el esquema demo_comercial, tablas con PK/FK/CHECK e inserta el snapshot sintético; se puede repetir (upserts). No elimina esquemas ni requiere un servidor expuesto. El sitio no ejecuta SQL ni solicita credenciales.</p><p><a href="../downloads/modelo-postgresql.sql" download>Modelo SQL completo y datos</a> · <a href="../downloads/consultas.sql" download>Consultas SQL</a> · <a href="../downloads/ventas.csv" download>Ventas CSV</a> · <a href="../downloads/productos.csv" download>Productos CSV</a> · <a href="../downloads/clientes.csv" download>Clientes CSV</a> · <a href="../downloads/sucursales.csv" download>Sucursales CSV</a> · <a href="../downloads/fechas.csv" download>Fechas CSV</a></p><p><a href="plataforma-bi.html#demostracion">Continuar a BI</a> · <a href="../downloads/modelo-powerbi.md" download>Guía Power BI</a> · <a href="../downloads/cargar-csv.pq" download>Función Power Query</a></p></details><p id="demo-message" class="demo-message" role="status" aria-live="polite">${esc(error||'PK, FK y medidas comprobadas antes de mostrar el modelo.')}</p>`;
    }
    const questions=['¿Cuáles son las ventas totales del contexto?','¿Cuánto vendió Centro en este período?','¿Cuántas unidades se vendieron?','¿Qué productos lideran las ventas?','¿Cuál es el margen por sucursal?'];
    function renderGuided() {
        const g=E.guided(question,filters),a=g.analysis;
        root.innerHTML=notice('Consultas guiadas y reglas analíticas ejecutables; no usa IA, LLM ni respuestas generativas. El resultado se calcula sobre las mismas líneas del ETL, Warehouse y BI.')+
            controls()+`<div class="demo-controls">${select('question-input','Consulta permitida',questions.map((text,i)=>[i,text]),question)}<button data-action="export-guided">Descargar evidencia</button></div>`+
            metrics([['Resultado',question===2?g.value:money(g.value)],['Filas consultadas',a.count],['Documentos',a.invoices],['Motor','Reglas JavaScript']])+
            `<p>${esc(questions[question])} ${question===1?'Esta regla fija la sucursal Centro; reemplaza el filtro de sucursal elegido.':''}</p>`+
            (g.ranking.length?table([question===3?'Producto':'Sucursal','Ventas PYG','Costos PYG','Margen PYG'],g.ranking.map(r=>[name(question===3?D.products:D.branches,r.key),r.sales,r.costs,r.margin])):'')+
            `<details class="demo-inputs"><summary>Procedencia y evidencia de cálculo</summary><p>Parámetros efectivos: ${esc(JSON.stringify(g.filters))}. Se excluyen anulados, duplicados e inválidos del origen. Ventas = suma(cantidad × precio); margen = ventas − costos. Solo se ejecuta una de cinco consultas permitidas.</p>${table(detailHeaders,detailRows(a.rows))}<pre class="demo-log">-- SQL equivalente de referencia; no se ejecuta SQL en esta web.
SELECT SUM(ventas_pyg) AS ventas_pyg, SUM(costos_pyg) AS costos_pyg,
       SUM(cantidad) AS cantidad
FROM demo_comercial.ventas
WHERE fecha BETWEEN $1::date AND $2::date
  AND ($3::text IS NULL OR sucursal_id = $3);</pre></details>`+
            `<details class="demo-inputs"><summary>Qué requeriría una implementación con LLM</summary><div class="architecture"><span>Usuario autenticado</span>→<span>LLM</span>→<span>Herramienta SQL permitida</span>→<span>Fuente autorizada</span>→<span>Respuesta con evidencia</span></div><p>Se necesitaría un modelo real y herramientas de consulta con identidad y permisos por usuario, SQL parametrizado de solo lectura, límites de filas/tiempo/costo, auditoría, protección de datos y evaluación de resultados. El acceso a datos y las acciones se autorizan en el servidor; no se delegan al texto generado. Nada de esta arquitectura está conectado en la demo.</p><p>No interpreta preguntas libres ni promete comprensión semántica. Una regla analítica no es un modelo de inteligencia artificial.</p></details><p id="demo-message" role="status" aria-live="polite" class="demo-message${error?' error':''}">${esc(error||'Resultado reproducible; sin contenido generado por IA.')}</p>`;
    }
    function render() { if(id==='LG-005')renderPipeline();else if(id==='LG-006')renderWarehouse();else if(id==='LG-010')renderGuided();else renderBI(); }
    root.addEventListener('change',event=>{
        if(event.target.id==='load-mode'){pipeline.mode=event.target.value;return;}
        if(event.target.id==='question-input'){question=Number(event.target.value);error='';render();return;}
        if(event.target.id==='dimension-filter'){dimension=event.target.value;render();return;}
        if(event.target.id==='group-filter'){grouping=event.target.value;render();return;}
        const keys={'date-from':'from','date-to':'to','branch-filter':'branchId','category-filter':'category','product-filter':'productId','customer-filter':'customerId'};
        const key=keys[event.target.id];if(!key)return;
        try {const next={...filters,[key]:event.target.value};const analyzed=E.analyze(next);filters=next;result=analyzed;error='';}
        catch(e){error=e.message+' Se conserva el último filtro válido.';}
        render();
    });
    root.addEventListener('click',event=>{
        const action=event.target.closest('[data-action]')?.dataset.action;
        try {
        if(action==='reset'){
            filters={...defaults};result=E.analyze(filters);error='';dimension='facts';grouping='branchId';question=0;
            Object.assign(pipeline,{text:JSON.stringify(D.raw,null,2),snapshot:[...E.baseline.accepted],result:E.baseline,mode:'Completa',elapsed:null,stats:null,legacy:null});render();
        }
        if(action==='export-sales')csv([detailHeaders,...detailRows(result.rows)],'lg-007-ventas-filtradas.csv');
        if(action==='export-guided')csv([detailHeaders,...detailRows(E.guided(question,filters).analysis.rows)],'lg-010-evidencia.csv');
        if(action==='incremental-sample'){pipeline.text=JSON.stringify(E.incrementalExample(),null,2);pipeline.mode='Incremental';error='';render();}
        if(action==='run-etl') {
            if(new TextEncoder().encode(pipeline.text).length>1048576)throw Error('Máximo 1 MiB de JSON');
            const raw=JSON.parse(pipeline.text),start=performance.now();
            const next=pipeline.mode==='Incremental'?E.incremental(pipeline.snapshot,raw):E.transform(raw);
            const snapshot=next.rows??next.accepted;E.warehouse(snapshot);
            Object.assign(pipeline,{result:next,snapshot,stats:next.stats??null,elapsed:performance.now()-start});error='';render();
        }
        if(action==='export-loaded')csv([['id','documento','fecha','sucursal_id','cliente_id','producto_id','cantidad','precio_pyg','costo_unitario_pyg','ventas_pyg','costos_pyg'],...pipeline.snapshot.map(r=>[r.id,r.orderId,r.date,r.branchId,r.customerId,r.productId,r.qty,r.price,r.cost,r.sales,r.costs])],'lg-005-cargados.csv');
        if(action==='export-loaded-json')U.textDownload(JSON.stringify(pipeline.snapshot,null,2),'lg-005-snapshot.json','application/json;charset=utf-8');
        if(action==='export-etl')csv([['fila','id','resultado','motivo','original_json','transformado_json'],...pipeline.result.audit.map(r=>[r.index,r.raw?.id,r.status,r.reason,JSON.stringify(r.raw),r.row?JSON.stringify(r.row):''])],'lg-005-auditoria.csv');
        if(action==='export-query') {
            const a=E.analyze(filters),g=E.group(a.rows,grouping==='month'?r=>r.date.slice(0,7):grouping);
            csv([['grupo','ventas_pyg','costos_pyg','margen_pyg','cantidad','documentos'],...g.map(r=>[r.key,r.sales,r.costs,r.margin,r.quantity,r.invoices])],'lg-006-consulta.csv');
        }
        if(action==='legacy-etl') {
            if(new TextEncoder().encode(pipeline.legacyText).length>1048576)throw Error('Máximo 1 MiB');
            const next=globalThis.LGPortfolioDemo.etl(JSON.parse(pipeline.legacyText));pipeline.legacy=next;error='';render();
        }
        }catch(e){error=e.message+' Se conserva el último resultado válido.';render();}
    });
    root.addEventListener('input',event=>{
        if(event.target.id==='etl-data')pipeline.text=event.target.value;
        if(event.target.id==='legacy-etl-data')pipeline.legacyText=event.target.value;
    });
    render();
})();
