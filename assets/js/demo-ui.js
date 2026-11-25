/* Interacciones locales. No se contactan ERP, bancos, Power BI ni modelos de IA. */
(() => {
    "use strict";
    const root = document.querySelector('[data-demo]');
    if (!root || !globalThis.LGPortfolioDemo) return;
    const E = globalThis.LGPortfolioDemo, id = root.dataset.demo;
    const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
    const money = n => n == null ? "—" : "Gs. " + Math.round(n).toLocaleString("es-PY");
    const metrics = items => `<div class="demo-metrics">${items.map(([k,v])=>`<div class="demo-metric"><strong>${esc(v)}</strong><span>${esc(k)}</span></div>`).join("")}</div>`;
    const table = (headers,rows) => `<div class="demo-table-wrap" tabindex="0" role="region" aria-label="Tabla de resultados, desplazable horizontalmente"><table class="demo-table"><thead><tr>${headers.map(h=>`<th scope="col">${esc(h)}</th>`).join("")}</tr></thead><tbody>${rows.length ? rows.map(r=>`<tr>${r.map(c=>`<td>${esc(c)}</td>`).join("")}</tr>`).join("") : `<tr><td colspan="${headers.length}">Sin registros para esta selección.</td></tr>`}</tbody></table></div>`;
    const notice = text => `<p class="demo-notice">${esc(text)}</p>`;
    const select = (key,label,options,value) => `<label for="${key}">${esc(label)}</label><select id="${key}">${options.map(x=>`<option value="${esc(x)}"${x===value?" selected":""}>${esc(x)}</option>`).join("")}</select>`;
    const movementText = rows => E.serializeCsv([["referencia","importe"],...rows.map(r=>[r.ref,r.amount])],";");
    const source = id === "LG-002" ? [E.sample.erp,E.sample.ledger] : id === "LG-009" ? [E.sample.cardSales,E.sample.cardSettlements] : [E.sample.bankInternal,E.sample.bankStatement];
    const S = {step:0,branch:"Todas",month:"Todos",units:20,fee:2,filter:"Todos",left:source[0],right:source[1],leftText:movementText(source[0]),rightText:movementText(source[1]),etlText:JSON.stringify(E.sample.etlRaw,null,2),etl:E.etl(E.sample.etlRaw),csvText:null,csvOutput:null,delimiter:",",safe:true,message:"",error:false};
    let reconciliation = [];
    function download(rows, filename, neutralize = true) {
        if (neutralize) rows = rows.map(row => row.map(v => typeof v === "string" && /^[\s\uFEFF]*[=+@-]/.test(v) ? "'" + v : v));
        const url = URL.createObjectURL(new Blob(["\uFEFF"+E.serializeCsv(rows,";")],{type:"text/csv;charset=utf-8"}));
        const a = document.createElement("a"); a.href=url; a.download=filename; a.click();
        setTimeout(()=>URL.revokeObjectURL(url),1000);
    }
    function reconciliationView() {
        reconciliation = id === "LG-009" ? E.cardReconciliation(S.fee/100,S.left,S.right) : E.reconcile(S.left,S.right);
        const c = E.summaries(reconciliation), rows = reconciliation.filter(r=>S.filter==="Todos"||r.status===S.filter);
        const labels = id === "LG-002" ? ["Gestión ERP","Libro Mayor"] : id === "LG-009" ? ["Venta bruta","Liquidación neta"] : ["Registro interno","Extracto bancario"];
        return notice("Cruce real en el navegador por referencia e importe entero. Referencias duplicadas se apartan para revisión; los faltantes se conservan. Usá solo movimientos sintéticos.") +
            `<details class="demo-inputs"><summary>Editar movimientos sintéticos</summary><p>Formato CSV con punto y coma. Encabezado: referencia;importe. Importes enteros en PYG, sin separadores. Hasta 20.000 filas por conjunto.</p><div class="demo-input-grid">${["left","right"].map((k,i)=>`<label for="${k}-data">${labels[i]}<textarea id="${k}-data" class="demo-textarea" spellcheck="false">${esc(S[k+"Text"])}</textarea></label>`).join("")}</div><button data-action="process">Procesar movimientos</button></details>` +
            `<div class="demo-controls">${id==="LG-009"?select("fee-input","Comisión hipotética (%)",["0","1","2","3","5"],String(S.fee)):""}${select("status-filter","Resultado",["Todos","Conciliado","Diferencia","Duplicado","Solo en origen","Solo en destino"],S.filter)}<button data-action="reset">Restablecer ejemplo</button><button data-action="export-reconciliation">Descargar resultados</button></div>`+
            metrics([["Referencias",c.total],["Conciliadas",c.matched],["Diferencias",c.differences],["Faltantes / duplicados",c.only+c.duplicates]])+
            table(["Referencia",id==="LG-009"?"Neto esperado":labels[0],labels[1],"Filas origen","Filas destino","Resultado"],rows.map(r=>[r.ref,money(r.origin),money(r.destination),r.originCount,r.destinationCount,r.status]));
    }
    function simulation(steps,label,text) {
        return notice(text)+`<div class="demo-controls"><button data-action="next"${S.step>=steps.length?" disabled":""}>${label}</button><button data-action="reset">Reiniciar</button></div>`+
            metrics([["Etapas",steps.length],["Completadas",S.step],["Pendientes",steps.length-S.step],["Modo","Simulación"]])+
            table(["Etapa","Proceso","Estado"],steps.map((s,i)=>[i+1,s,i<S.step?"Completado (simulado)":"Pendiente"]))+
            `<pre class="demo-log">${esc(S.step?steps.slice(0,S.step).map((s,i)=>`[SIMULADO ${i+1}] ${s}`).join("\n"):"Avanzá para recorrer el flujo ficticio.")}</pre>`;
    }
    function render() {
        const focused = document.activeElement?.id;
        let html = "";
        if (["LG-001","LG-002","LG-009"].includes(id)) html=reconciliationView();
        else if (id==="LG-003") html=simulation(["Abrir sesión ficticia","Seleccionar reporte conceptual","Definir período y parámetros","Simular exportación","Validar archivo ficticio","Registrar cierre de corrida"],"Simular siguiente etapa","Flujo RPA ilustrativo: no abre sistemas ERP ni ejecuta Python. Cada avance es manual y simulado.");
        else if (id==="LG-004") html=simulation(["Detectar cambio ficticio: ventas_2026_10.parquet","Calcular firma de entrada ficticia A1","Agregar lote a cola simulada","Actualizar derivado simulado","Registrar firma de salida ficticia B1","Ignorar evento idéntico sin reproceso"],"Procesar evento ficticio","Simulación de eventos e idempotencia: no lee archivos Parquet ni supervisa carpetas.");
        else if (id==="LG-005") {
            const r=S.etl;
            html=notice("ETL ejecutado en JavaScript: recorta espacios de IDs, valida cantidades y precios, excluye anulados y separa duplicados. Cada entrada queda aceptada o rechazada; no se eliminan excepciones.")+
                `<details class="demo-inputs"><summary>Editar lote sintético JSON</summary><label for="etl-data">Registros con id, qty, price y status</label><textarea id="etl-data" class="demo-textarea" spellcheck="false">${esc(S.etlText)}</textarea><button data-action="etl">Ejecutar ETL</button></details><div class="demo-controls"><button data-action="reset">Restablecer lote</button><button data-action="export-etl">Descargar auditoría ETL</button></div>`+
                metrics([["Entradas",r.accepted.length+r.rejected.length],["Aceptados",r.accepted.length],["Rechazados",r.rejected.length],["Importe válido",money(r.totalAmount)]])+
                table(["ID","Estado ETL","Detalle","Importe"],[...r.accepted.map(x=>[x.id,"Aceptado","Válido",money(x.amount)]),...r.rejected.map(x=>[x.id,"Rechazado",x.reason,"—"])]);
        } else if (id==="LG-006"||id==="LG-007") {
            const a=E.aggregateSales(S.branch,S.month), max=Math.max(1,...a.months.map(m=>m.amount));
            html=notice(id==="LG-007"?"Simulación de una experiencia BI. Los filtros calculan agregados en JavaScript; no es un informe Power BI ni usa Power BI Service.":"Consulta analítica ejecutada sobre hechos sintéticos en memoria. No hay servidor SQL. Se excluyen ventas anuladas; podés comparar sucursal y mes.")+
                `<div class="demo-controls">${select("branch-filter","Sucursal",["Todas","Centro","Norte","Sur"],S.branch)}${select("month-filter","Mes",["Todos","Ene","Feb","Mar","Abr"],S.month)}<button data-action="export-sales">Descargar consulta</button></div>`+
                metrics([["Ventas válidas",a.count],["Importe",money(a.total)],["Unidades",a.units],["Meses con ventas",a.months.filter(m=>m.amount>0).length]])+
                `<div class="demo-chart" role="img" aria-label="Ventas mensuales; valores exactos en la tabla siguiente">${a.months.map(m=>`<div class="demo-chart-item"><div class="demo-chart-bar" style="height:${Math.round(m.amount/max*100)}%"></div><small>${m.month}</small></div>`).join("")}</div>`+table(["Mes","Ventas PYG"],a.months.map(m=>[m.month,m.amount]))+
                `<details class="demo-inputs"><summary>Modelo dimensional y datos de origen</summary><p>Grano: línea de venta. Dimensiones: mes, sucursal y producto. Medida: SUM(units × price), filtrada por status = OK. Dataset didáctico, sin implementación SQL conectada.</p>${table(["ID","Mes","Sucursal","Producto","Unidades","Precio PYG","Estado"],E.sample.sales.map(r=>[r.id,r.month,r.branch,r.product,r.units,r.price,r.status]))}</details>`;
        } else if (id==="LG-008") {
            const r=E.recipeRequirements(S.units),stock=[5,1,15];
            html=notice("Producto ficticio: lote de chipá. BOM sin mermas. Existencias sintéticas fijas: harina 5 kg, queso 1 kg y 15 empaques. Los faltantes se calculan localmente; no se reserva ni descuenta stock real.")+
                `<div class="demo-controls"><label for="units-input">Unidades a fabricar</label><input id="units-input" type="number" min="0" max="100000" step="1" value="${S.units}"><button data-action="calc">Calcular materiales</button><button data-action="reset">Restablecer</button></div>`+
                metrics([["Unidades",S.units],["Materiales",r.length],["Con faltantes",r.filter((x,i)=>x.quantity>stock[i]).length],["Consumo","Teórico"]])+
                table(["Material","Requerido","Disponible ficticio","Faltante","Unidad"],r.map((x,i)=>[x.ingredient,x.quantity,stock[i],Math.max(0,Number((x.quantity-stock[i]).toFixed(3))),x.unit]));
        } else if (id==="LG-010") {
            const q=["¿Cuáles son las ventas totales?","¿Cuánto vendió Centro?","¿Cuántas unidades se vendieron?"];
            const result=[money(E.aggregateSales().total),money(E.aggregateSales("Centro").total),String(E.aggregateSales().units)];
            html=notice("Simulación por preguntas predefinidas y reglas. No usa LLM, IA real, SQL ni servicios externos. Las respuestas numéricas se calculan sobre los datos sintéticos de LG-006.")+
                `<div class="demo-controls"><label for="question-input">Pregunta predefinida</label><select id="question-input">${q.map((x,i)=>`<option value="${i}"${i===S.step?" selected":""}>${esc(x)}</option>`).join("")}</select></div><div class="demo-log"><strong>Pregunta:</strong> ${esc(q[S.step])}<br><strong>Respuesta calculada:</strong> ${esc(result[S.step])}</div>`;
        } else if (id==="LG-011") html=simulation(["Iniciar ejecución ficticia","Job ETL A: completado","Job ETL B: falla simulada","Emitir alerta conceptual","Aplicar reintento simulado","Job ETL B: recuperado","Cerrar ejecución ficticia"],"Avanzar ejecución ficticia","Historial ilustrativo: no consulta tareas de Windows ni envía alertas. La falla y la recuperación son simuladas.");
        else if (id==="LG-012") html=notice("Conversión CSV local, hasta 1 MiB y 20.000 registros. Usá exclusivamente archivos sintéticos. No admite .xlsx/.xls ni envía archivos por red. Conserva el texto de los códigos y los campos vacíos; no convierte tipos.")+
            `<div class="demo-controls"><label for="csv-file">CSV sintético</label><input type="file" id="csv-file" accept=".csv,text/csv"><label for="csv-delimiter">Separador origen</label><select id="csv-delimiter">${[[",","Coma"],[";","Punto y coma"],["\t","Tabulación"]].map(([v,t])=>`<option value="${v}"${v===S.delimiter?" selected":""}>${t}</option>`).join("")}</select><button data-action="sample">Cargar ejemplo</button><button data-action="download"${S.csvOutput===null?" disabled":""}>Descargar CSV ;</button></div><label class="csv-safe"><input id="csv-safe" type="checkbox"${S.safe?" checked":""}> Neutralizar celdas que puedan ejecutarse como fórmulas en Excel (agrega apóstrofo)</label><p class="demo-small">Desmarcar conserva el texto exacto. CSV no almacena tipos: al importar en Excel, elegí Texto para los códigos. Encabezados obligatorios, únicos y no vacíos; todas las filas deben tener igual cantidad de campos.</p><label for="csv-preview">Vista previa de salida</label><textarea class="demo-textarea" id="csv-preview" readonly>${esc(S.csvOutput||"")}</textarea>`;
        root.innerHTML=html+`<p id="demo-message" class="demo-message${S.error?" error":""}" role="status" aria-live="polite">${esc(S.message)}</p>`;
        if(focused) root.querySelector(`#${focused}`)?.focus();
    }
    function message(text,error=false) { S.message=text;S.error=error;const el=root.querySelector('#demo-message');el.textContent=text;el.classList.toggle('error',error); }
    function convert() {
        S.csvOutput=null;
        const rows=E.validateCsv(E.parseCsv(S.csvText,S.delimiter));
        let neutralized=0;
        const output=rows.map(row=>row.map(v=>{
            if(S.safe&&/^[\s\uFEFF]*[=+@-]/.test(v)){neutralized++;return "'"+v;}
            return v;
        }));
        S.csvOutput=E.serializeCsv(output,";");
        S.message=`${rows.length-1} registros · ${rows[0].length} columnas · ${neutralized} celdas neutralizadas. Procesamiento local.`;S.error=false;
    }
    root.addEventListener("input",e=>{
        if(e.target.id==="left-data")S.leftText=e.target.value;
        if(e.target.id==="right-data")S.rightText=e.target.value;
        if(e.target.id==="etl-data")S.etlText=e.target.value;
    });
    root.addEventListener("click",e=>{
        const action=e.target.closest('[data-action]')?.dataset.action;if(!action)return;
        try {
            S.message="";S.error=false;
            if(action==="process") {
                if(new TextEncoder().encode(S.leftText+S.rightText).length>1048576)throw Error("Máximo 1 MiB entre ambos conjuntos");
                const l=E.readMovements(S.leftText),r=E.readMovements(S.rightText);
                if(id==="LG-009") E.cardReconciliation(S.fee/100,l,r);
                else E.reconcile(l,r);
                S.left=l;S.right=r;S.filter="Todos";S.message=`Procesados ${l.length} registros de origen y ${r.length} de destino.`;
            } else if(action==="reset") {
                S.step=0;S.units=20;S.fee=2;S.filter="Todos";S.left=source[0];S.right=source[1];S.leftText=movementText(S.left);S.rightText=movementText(S.right);S.etlText=JSON.stringify(E.sample.etlRaw,null,2);S.etl=E.etl(E.sample.etlRaw);S.message="Ejemplo sintético restablecido.";
            } else if(action==="next") { S.step++;S.message=`Etapa simulada ${S.step} completada.`; }
            else if(action==="calc") {
                const raw=root.querySelector('#units-input').value;
                if(!raw.trim())throw Error("Ingresá una cantidad de unidades");
                const n=Number(raw);E.recipeRequirements(n);S.units=n;S.message="Requerimientos y faltantes recalculados.";
            } else if(action==="etl") {
                if(new TextEncoder().encode(S.etlText).length>1048576)throw Error("El lote supera 1 MiB");
                const result=E.etl(JSON.parse(S.etlText));S.etl=result;S.message="ETL ejecutado; los rechazos se conservan en la auditoría.";
            } else if(action==="sample") {
                S.delimiter=",";S.csvText='codigo,producto,cantidad,comentario\r\n001,Chipá,3,"Ejemplo, con coma"\r\n002,Pan integral,,"Texto con ""comillas"""\r\n';convert();
            } else if(action==="download"&&S.csvOutput!==null) {
                download(E.parseCsv(S.csvOutput,";"),"horizonte-demo-convertido.csv",false);S.message="Descarga CSV generada localmente.";
            } else if(action==="export-reconciliation") {
                download([["referencia","origen_pyg","destino_pyg","filas_origen","filas_destino","estado"],...reconciliation.filter(r=>S.filter==="Todos"||r.status===S.filter).map(r=>[r.ref,r.origin,r.destination,r.originCount,r.destinationCount,r.status])],`${id.toLowerCase()}-resultado.csv`);S.message="Descarga de resultados generada; respeta el filtro de estado.";
            } else if(action==="export-etl") {
                download([["id","cantidad","precio_pyg","estado","importe_pyg","resultado","motivo"],...S.etl.accepted.map(r=>[r.id,r.qty,r.price,r.status,r.amount,"Aceptado",""]),...S.etl.rejected.map(r=>[r.id,r.qty,r.price,r.status,"","Rechazado",r.reason])],"lg-005-auditoria.csv");S.message="Auditoría completa generada para descarga.";
            } else if(action==="export-sales") {
                download([["mes","ventas_pyg"],...E.aggregateSales(S.branch,S.month).months.map(r=>[r.month,r.amount])],"lg-006-consulta.csv");S.message="Consulta filtrada generada para descarga.";
            }
            render();
        } catch(err) { message(err.message+(action==="process"?" Se conserva el último resultado válido.":""),true); }
    });
    root.addEventListener("change",async e=>{
        try {
            if(e.target.id==="csv-file") {
                const file=e.target.files?.[0];if(!file)return;
                S.csvOutput=null;S.csvText=null;
                if(file.size>1048576||!/\.csv$/i.test(file.name))throw Error("Usá un archivo .csv sintético de hasta 1 MiB");
                const text=await file.text();
                if(text.includes('\uFFFD'))throw Error("Guardá el CSV con codificación UTF-8");
                S.csvText=text;convert();
            } else if(e.target.id==="csv-delimiter") {S.delimiter=e.target.value;if(S.csvText!==null)convert();}
            else if(e.target.id==="csv-safe") {S.safe=e.target.checked;if(S.csvText!==null)convert();}
            else {
                const keys={"status-filter":"filter","branch-filter":"branch","month-filter":"month","fee-input":"fee","question-input":"step"};
                const key=keys[e.target.id];if(!key)return;
                const value=["fee","step"].includes(key)?Number(e.target.value):e.target.value;
                if(key==="fee") E.cardReconciliation(value/100,S.left,S.right);
                S[key]=value;S.message="Selección aplicada.";S.error=false;
            }
            render();
        } catch(err) { S.csvOutput=null;S.message=err.message;S.error=true;render(); }
    });
    render();
})();
