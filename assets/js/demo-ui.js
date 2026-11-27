/* LG-012: CSV local. Los demás proyectos usan vistas especializadas. */
(() => {
    'use strict';
    const root=document.querySelector('[data-demo="LG-012"]');if(!root)return;
    const E=globalThis.LGPortfolioDemo,U=globalThis.LGDemoUI;
    const {esc,metrics,select,notice,csv}=U;
    const initial=()=>({source:null,rows:null,output:null,stats:null,delimiter:',',safe:true,trim:false,empty:false,dedupe:false,column:-1,letterCase:'none',message:'Seleccioná un CSV sintético o cargá el ejemplo.',error:false});
    let S=initial(),loadVersion=0;
    function convert() {
        if(S.source===null)return;
        const source=E.parseCsv(S.source,S.delimiter);
        const transformed=E.transformCsv(source,{trim:S.trim,removeEmpty:S.empty,dedupe:S.dedupe,column:S.column,letterCase:S.letterCase});
        let neutralized=0;
        const output=transformed.rows.map(row=>row.map(value=>{
            if(S.safe&&/^[\s\uFEFF]*[=+@-]/.test(value)){neutralized++;return "'"+value;}return value;
        }));
        const serialized=E.serializeCsv(output,';');
        Object.assign(S,{rows:output,output:serialized,stats:{...transformed.stats,neutralized},error:false,
            message:`${transformed.stats.outputRows} registros · ${transformed.stats.columns} columnas · ${neutralized} celdas neutralizadas · ${transformed.stats.empty} filas vacías y ${transformed.stats.duplicates} duplicadas excluidas por las opciones elegidas.`});
    }
    function render() {
        const s=S.stats;
        const checkbox=(id,label,checked)=>`<label class="csv-safe"><input id="${id}" type="checkbox"${checked?' checked':''}> ${esc(label)}</label>`;
        root.innerHTML=notice('Procesamiento CSV local, hasta 1 MiB y 20.000 registros. No admite XLS/XLSX ni macros. Usá solo datos sintéticos; el archivo no se envía por red. Por defecto se conservan todos los registros y textos originales.')+
            `<div class="demo-controls"><label class="demo-field" for="csv-file">Archivo CSV sintético<input type="file" id="csv-file" accept=".csv,text/csv"></label>${select('csv-delimiter','Separador origen',[[',','Coma'],[';','Punto y coma'],['\t','Tabulación']],S.delimiter)}<button data-action="sample">Cargar ejemplo</button><button data-action="convert"${S.source===null?' disabled':''}>Transformar</button><button data-action="download"${S.output===null?' disabled':''}>Descargar CSV ;</button><button data-action="reset">Reiniciar</button></div>`+
            `<div class="csv-options">${checkbox('csv-safe','Neutralizar celdas que puedan ejecutarse como fórmulas en Excel (agrega apóstrofo)',S.safe)}${checkbox('csv-trim','Recortar espacios de encabezados y campos',S.trim)}${checkbox('csv-empty','Excluir filas completamente vacías',S.empty)}${checkbox('csv-dedupe','Excluir registros exactamente duplicados tras transformar',S.dedupe)}</div>`+
            `<div class="demo-controls">${select('csv-column','Columna para transformar texto',[[-1,'Ninguna'],...(S.rows?.[0]||[]).map((h,i)=>[i,h])],S.column)}${select('csv-case','Transformación de texto',[['none','Conservar'],['upper','Mayúsculas'],['lower','Minúsculas']],S.letterCase)}</div>`+
            metrics([['Registros origen',s?.inputRows??'—'],['Registros salida',s?.outputRows??'—'],['Columnas',s?.columns??'—'],['Celdas neutralizadas',s?.neutralized??'—']])+
            `<p class="demo-small">Vista previa: hasta 50 registros; la descarga incluye todos los resultados. CSV no almacena tipos: importar códigos como Texto en Excel para conservar ceros iniciales. Campos vacíos permanecen vacíos. Desmarcar la protección conserva el texto exacto de posibles fórmulas.</p><label for="csv-preview">Vista previa del CSV de salida</label><textarea id="csv-preview" class="demo-textarea" readonly>${esc(S.rows?E.serializeCsv(S.rows.slice(0,51),';'):'')}</textarea>`+
            `<details class="demo-inputs"><summary>Reglas, alcance y arquitectura</summary><p>Parser con comillas, escapes, saltos de línea y BOM UTF-8. Encabezados obligatorios, no vacíos y únicos; filas de ancho uniforme. Solo se excluyen filas vacías o duplicadas cuando se activa explícitamente su opción; se informa su cantidad. Mayúsculas/minúsculas afecta solo la columna elegida, sin convertir códigos ni números.</p><p>Ante formato o codificación inválida se bloquea la descarga y se vacía la vista previa para evitar exportar un resultado obsoleto. Elegir otro separador permite volver a interpretar el mismo texto. Un error de transformación no exporta cambios parciales. Todas las operaciones se ejecutan en memoria del navegador.</p><p>Implementación empresarial: recepción de archivos autorizados → validación de contrato → transformaciones versionadas → auditoría y cuarentena → exportación. XLS/XLSX exigiría un lector adicional y validaciones que esta demo no implementa.</p></details><p id="demo-message" class="demo-message${S.error?' error':''}" role="status" aria-live="polite">${esc(S.message)}</p>`;
    }
    function fail(error) {S.output=null;S.rows=null;S.stats=null;S.error=true;S.message=error.message;render();}
    root.addEventListener('click',event=>{
        const action=event.target.closest('[data-action]')?.dataset.action;if(!action)return;
        try {
            if(action==='reset'){loadVersion++;S=initial();}
            if(action==='sample') {
                loadVersion++;S=initial();
                S.source='codigo,producto,cantidad,comentario\r\n001,Chipá,3,"Ejemplo, con coma"\r\n002,Pan integral,,"Texto con ""comillas"""\r\n003,Budín,1,=1+1\r\n';convert();
            }
            if(action==='convert')convert();
            if(action==='download'&&S.output!==null){csv(S.rows,'democomercial-convertido.csv',false);S.message='Descarga completa generada localmente.';}
            render();
        }catch(error){fail(error);}
    });
    root.addEventListener('change',async event=>{
        try {
            if(event.target.id==='csv-file') {
                const file=event.target.files?.[0];if(!file)return;
                const version=++loadVersion;
                S.source=null;S.output=null;S.rows=null;S.stats=null;S.column=-1;
                if(file.size>1048576||!/\.csv$/i.test(file.name))throw Error('Usá un archivo .csv de hasta 1 MiB');
                const bytes=await file.arrayBuffer();if(version!==loadVersion)return;
                try {S.source=new TextDecoder('utf-8',{fatal:true}).decode(bytes);}
                catch {throw Error('Codificación inválida: guardá el archivo como CSV UTF-8.');}
                convert();
            }else if(event.target.id==='csv-delimiter'){S.delimiter=event.target.value;S.column=-1;convert();}
            else if(event.target.id==='csv-column'){S.column=Number(event.target.value);convert();}
            else if(event.target.id==='csv-case'){S.letterCase=event.target.value;convert();}
            else {
                const keys={'csv-safe':'safe','csv-trim':'trim','csv-empty':'empty','csv-dedupe':'dedupe'},key=keys[event.target.id];
                if(!key)return;S[key]=event.target.checked;convert();
            }
            render();
        }catch(error){fail(error);}
    });
    render();
})();
