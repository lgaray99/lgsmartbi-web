/* Regresión HTTP real en Edge/Chromium; monta un servidor efímero bajo un subdirectorio. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');
const catalog = require('../projects.json');
async function staticSite() {
    const http=require('node:http'),root=path.resolve(__dirname,'..'),prefix='/portfolio-review/';
    const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.csv':'text/csv','.json':'application/json','.png':'image/png'};
    const server=http.createServer((req,res)=>{
        try {
            const pathname=new URL(req.url,'http://localhost').pathname;
            if(!pathname.startsWith(prefix)){res.writeHead(404);res.end();return;}
            const relative=decodeURIComponent(pathname.slice(prefix.length))||'index.html';
            const file=path.resolve(root,relative);
            if(!file.startsWith(root+path.sep)||relative.split(/[\\/]/).some(p=>p.startsWith('.')||['node_modules','auditoria-local'].includes(p))){res.writeHead(403);res.end();return;}
            fs.readFile(file,(err,data)=>{res.writeHead(err?404:200,{'Content-Type':(mime[path.extname(file)]||'text/plain')+'; charset=utf-8'});res.end(err?'No encontrado':data);});
        }catch{res.writeHead(400);res.end();}
    });
    await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
    return {url:`http://127.0.0.1:${server.address().port}${prefix}`,close:()=>new Promise(resolve=>server.close(resolve))};
}

(async () => {
    const site=process.env.BASE_URL?null:await staticSite(),base=process.env.BASE_URL||site.url;
    let browser;
    try {browser=await chromium.launch({headless: true, ...(process.platform === 'win32' ? {channel: 'msedge'} : {})});}
    catch(e){await site?.close();throw e;}
    const page = await browser.newPage();
    const errors = [], checks = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => { if (m.type() === 'error' && !/fonts\.|net::ERR/.test(m.text())) errors.push(m.text()); });
    page.on('response', r => { if (r.url().startsWith(base) && r.status() >= 400) errors.push(`${r.status()} ${r.url()}`); });
    page.on('requestfailed', r => {if(r.url().startsWith(base))errors.push(`Recurso local fallido: ${r.url()}`);});
    try {
        for (const width of [1440, 800, 390]) {
            await page.setViewportSize({width, height: 900});
            for (const route of ['index.html', ...catalog.map(p => `proyectos/${p.slug}.html`)]) {
                const response = await page.goto(new URL(route, base).href, {waitUntil: 'domcontentloaded'});
                assert.equal(response.status(), 200, route);
                assert.equal(await page.locator('h1').count(), 1, route);
                if (route !== 'index.html') {
                    await page.waitForFunction(() => document.querySelector('[data-demo] .demo-metrics, [data-demo] .demo-controls'));
                    assert.ok(!(await page.locator('[data-demo]').innerText()).includes('Cargando demostración'), route);
                }
                const layout = await page.evaluate(() => ({
                    width: innerWidth, scroll: document.documentElement.scrollWidth,
                    broken: [...document.images].filter(i => i.complete && !i.naturalWidth).map(i => i.getAttribute('src'))
                }));
                assert.ok(layout.scroll <= layout.width + 1, `${width}px ${route}: overflow ${layout.scroll}`);
                assert.deepEqual(layout.broken, [], route);
                if(width===1440) {
                    const links=await page.locator('[data-demo] a[href]').evaluateAll(elements=>elements.map(a=>a.href));
                    for(const href of new Set(links))if(href.startsWith(base))assert.equal((await page.request.get(href)).status(),200,href);
                }
                checks.push(`${width}px ${route}`);
            }
        }
        await page.setViewportSize({width:1440,height:1000});
        await page.goto(new URL('proyectos/plataforma-bi.html#demostracion',base).href);
        const kpi=()=>page.locator('[data-demo] .demo-metric strong').allTextContents();
        const initial=await kpi();
        assert.equal(initial[0],'Gs. 5.017.000');assert.equal(initial[1],'Gs. 2.993.000');
        await page.locator('#branch-filter').selectOption('S001');
        assert.notEqual((await kpi())[0],initial[0]);
        await page.locator('#category-filter').selectOption('Bebidas');
        await page.locator('#product-filter').selectOption('P001');
        assert.equal((await kpi())[0],'Gs. 0');
        await page.locator('[data-action="reset"]').click();
        assert.deepEqual(await kpi(),initial);
        await page.locator('#customer-filter').selectOption('C001');
        assert.notEqual((await kpi())[0],initial[0]);
        await page.locator('#date-from').fill('2026-06-01');
        await page.locator('#date-to').fill('2026-01-01');
        assert.ok((await page.locator('#demo-message').innerText()).includes('Se conserva'));
        assert.equal(await page.locator('#date-to').inputValue(),'2026-06-30');
        await page.locator('[data-action="reset"]').click();
        const biDownload=page.waitForEvent('download');await page.locator('[data-action="export-sales"]').click();
        const bi=await biDownload;
        const csv=require('../assets/js/demo-engine.js');
        const records=csv.parseCsv(fs.readFileSync(await bi.path(),'utf8'),';');
        assert.equal(records.length,85);assert.equal(records.slice(1).reduce((s,r)=>s+Number(r[9]),0),5017000);
        checks.push('LG-007: KPIs conocidos, cinco filtros, rango inválido atómico, reset y CSV verificado');
        await page.goto(new URL('proyectos/pipeline-etl.html#demostracion',base).href);
        await page.locator('[data-action="run-etl"]').click();
        assert.equal((await kpi())[3],'84');
        await page.locator('[data-action="incremental-sample"]').click();
        await page.locator('[data-action="run-etl"]').click();
        assert.equal((await kpi())[3],'85');assert.equal((await kpi())[5],'1 / 1');
        await page.locator('[data-action="run-etl"]').click();
        assert.equal((await kpi())[3],'85');assert.equal((await kpi())[6],'2 / 0');
        await page.locator('details:has(#etl-data) summary').click();
        await page.locator('#etl-data').fill('{JSON INVALIDO');
        await page.locator('[data-action="run-etl"]').click();
        assert.equal((await kpi())[3],'85');assert.ok((await page.locator('#demo-message').innerText()).includes('Se conserva'));
        await page.locator('[data-action="reset"]').click();
        const auditWait=page.waitForEvent('download');await page.locator('[data-action="export-etl"]').click();
        const audit=csv.parseCsv(fs.readFileSync(await (await auditWait).path(),'utf8'),';');
        assert.equal(audit.length,102);assert.equal(audit.slice(1).filter(r=>r[2]==='Rechazado').length,17);
        assert.equal(audit[1][0],'1');assert.equal(JSON.parse(audit[1][4]).id,' V-0101-1 ');
        await page.locator('details:has(#legacy-etl-data) summary').click();
        await page.locator('[data-action="legacy-etl"]').click();
        assert.equal(await page.locator('details:has(#legacy-etl-data) tbody tr').count(),6);
        checks.push('LG-005: completa, incremental, idempotencia, error atómico, reset y auditoría de 101 entradas');
        await page.goto(new URL('proyectos/data-warehouse-comercial.html#demostracion',base).href);
        await page.locator('#branch-filter').selectOption('S002');
        assert.notEqual((await kpi())[2],'Gs. 5.017.000');
        for(const value of ['products','customers','branches','dates','facts'])await page.locator('#dimension-filter').selectOption(value);
        for(const value of ['month','productId','customerId','branchId'])await page.locator('#group-filter').selectOption(value);
        const queryWait=page.waitForEvent('download');await page.locator('[data-action="export-query"]').click();
        const queryRows=csv.parseCsv(fs.readFileSync(await (await queryWait).path(),'utf8'),';');
        assert.equal(queryRows.length,2);
        const expected=require('../assets/js/commercial-engine.js').analyze({branchId:'S002'}).sales;
        assert.equal(Number(queryRows[1][1]),expected);
        for(const filename of ['modelo-postgresql.sql','consultas.sql','ventas.csv','productos.csv','clientes.csv','sucursales.csv','fechas.csv','modelo-powerbi.md','cargar-csv.pq','medidas.dax']){
            const response=await page.request.get(new URL('downloads/'+filename,base).href);assert.equal(response.status(),200,filename);
        }
        checks.push('LG-006: dimensiones, filtros, agrupaciones, consulta exportada y recursos descargables');
        for(const slug of ['conciliacion-bancaria','conciliacion-contable']) {
            await page.goto(new URL(`proyectos/${slug}.html#demostracion`,base).href);
            const before=await kpi();
            await page.locator('#status-filter').selectOption('Duplicado');
            const wait=page.waitForEvent('download');await page.locator('[data-action="export-reconciliation"]').click();
            const exported=csv.parseCsv(fs.readFileSync(await (await wait).path(),'utf8'),';');
            assert.equal(exported.length,2);assert.equal(exported[1][5],'Duplicado');
            await page.locator('details:has(#left-data) summary').click();
            await page.locator('#left-data').fill('referencia;importe\n001;NO_NUMERICO\n');
            await page.locator('[data-action="process"]').click();
            assert.deepEqual(await kpi(),before);assert.ok((await page.locator('#demo-message').innerText()).includes('Se conserva'));
            await page.locator('details:has(#left-data) summary').click();
            const syntheticHtml='referencia;importe\n<img src=x onerror=demoInjected=1>;100\n';
            await page.locator('#left-data').fill(syntheticHtml);await page.locator('#right-data').fill(syntheticHtml);
            await page.locator('[data-action="process"]').click();assert.equal(await page.locator('[data-demo] img').count(),0);
            if(slug==='conciliacion-bancaria') {
                await page.locator('details:has(#left-data) summary').click();
                const header=['id','referencia','fecha','importe'];
                const rows=Array.from({length:500},(_,i)=>['L'+i,'LOTE-EXTENSO',i%2?'2026-01-03':'2026-01-01',i+1]);
                const other=rows.map((r,i)=>['R'+i,r[1],i%2?'2026-01-05':'2026-01-02',r[3]]);
                await page.locator('#left-data').fill(csv.serializeCsv([header,...rows],';'));
                await page.locator('#right-data').fill(csv.serializeCsv([header,...other],';'));
                await page.locator('[data-action="process"]').click();
                assert.equal((await kpi())[0],'500 / 500');
                assert.ok((await page.locator('.demo-table').first().innerText()).includes('Ambiguo'));
                assert.equal(await page.locator('#demo-message.error').count(),0);
            }
            await page.locator('[data-action="reset"]').click();
            await page.locator('#amount-tolerance').fill('2000');await page.locator('#day-tolerance').fill('2');
            await page.locator('[data-action="apply"]').click();
            assert.ok(Number((await kpi())[1])>Number(before[1]));
            await page.locator('[data-action="reset"]').click();assert.deepEqual(await kpi(),before);
            checks.push(`${slug}: filtro, exportación, importación inválida atómica, tolerancias y reset`);
        }
        await page.goto(new URL('proyectos/conciliacion-procesadoras.html#demostracion',base).href);
        assert.equal((await kpi())[1],'2');
        await page.locator('#retention-input').fill('1');await page.locator('[data-action="apply"]').click();
        assert.equal((await kpi())[1],'0');
        await page.locator('#retention-input').fill('99');await page.locator('[data-action="apply"]').click();
        assert.equal(await page.locator('#retention-input').inputValue(),'1.00');
        assert.ok((await page.locator('#demo-message').innerText()).includes('Se conserva'));
        await page.locator('[data-action="reset"]').click();
        await page.locator('#status-filter').selectOption('Liquidación pendiente');
        assert.ok((await page.locator('.demo-table').first().innerText()).includes('CUP-13'));
        await page.locator('#as-of').fill('2026-07-03');await page.locator('[data-action="apply"]').click();
        assert.ok((await page.locator('[data-demo]').innerText()).includes('Liquidación vencida'));
        checks.push('LG-009: comisión/retención, tasa inválida atómica, corte, vencimiento y reset');
        await page.goto(new URL('proyectos/automatizacion-erp-rpa.html#demostracion',base).href);
        await page.locator('[data-action="ops-run"]').click();
        assert.equal((await kpi())[1],'2');assert.equal((await kpi())[2],'1');
        assert.ok((await page.locator('.demo-log').innerText()).includes('Intento 2'));
        const opsWait=page.waitForEvent('download');await page.locator('[data-action="export-operations"]').click();
        const opsRows=csv.parseCsv(fs.readFileSync(await (await opsWait).path(),'utf8'),';');assert.ok(opsRows.length>10);
        await page.locator('[data-action="reset"]').click();assert.equal((await kpi())[1],'0');
        await page.locator('#max-retries').fill('0');await page.locator('[data-action="ops-run"]').click();assert.equal((await kpi())[2],'2');
        checks.push('LG-003: cola, reintentos 0/1, error permanente, actividad CSV y reinicio');
        await page.goto(new URL('proyectos/monitor-parquet.html#demostracion',base).href);
        await page.locator('[data-action="detect"]').click();await page.locator('[data-action="ops-step"]').click();
        assert.ok((await page.locator('.demo-table').nth(1).innerText()).includes('ventas-v1'));
        await page.locator('[data-action="detect"]').click();await page.locator('[data-action="detect"]').click();
        await page.locator('[data-action="ops-step"]').click();assert.ok((await page.locator('.demo-table').nth(1).innerText()).includes('ventas-v1'));
        await page.locator('[data-action="ops-step"]').click();assert.ok((await page.locator('.demo-table').nth(1).innerText()).includes('ventas-v2'));
        for(let i=0;i<5;i++){await page.locator('[data-action="detect"]').click();await page.locator('[data-action="ops-run"]').click();}
        assert.equal((await kpi())[2],'1');
        assert.ok(!(await page.locator('.demo-table').nth(1).innerText()).includes('ventas.parquet'));
        await page.locator('[data-action="reset"]').click();assert.equal((await kpi())[0],'0');
        checks.push('LG-004: eventos, idempotencia, fallos, reintentos, baja y reinicio');
        await page.goto(new URL('proyectos/inventario-produccion.html#demostracion',base).href);
        const inventoryBefore=await page.locator('.demo-table').first().innerText();
        assert.ok(inventoryBefore.includes('4,6'));assert.ok(inventoryBefore.includes('1,6'));
        await page.locator('#bom-product').selectOption('P006');await page.locator('#units-input').fill('1');await page.locator('[data-action="bom-calc"]').click();
        assert.ok((await page.locator('.demo-table').first().innerText()).includes('0,76'));
        await page.locator('details:has(#recipe-data) summary').click();
        await page.locator('#recipe-data').fill('{"P002":[{"id":"P002","quantity":1,"unit":"unidad"}]}');
        const combo=await page.locator('.demo-table').first().innerText();
        await page.locator('[data-action="bom-calc"]').click();assert.equal(await page.locator('.demo-table').first().innerText(),combo);
        assert.ok((await page.locator('#demo-message').innerText()).includes('circular'));
        await page.locator('[data-action="reset"]').click();assert.equal(await page.locator('.demo-table').first().innerText(),inventoryBefore);
        const bomWait=page.waitForEvent('download');await page.locator('[data-action="export-bom"]').click();
        const bomRows=csv.parseCsv(fs.readFileSync(await (await bomWait).path(),'utf8'),';');assert.equal(bomRows.length,4);assert.equal(bomRows[1][1],'4.6');
        checks.push('LG-008: BOM conocido, multinivel, ciclo rechazado sin modificar resultado, CSV y reset');
        await page.goto(new URL('proyectos/monitoreo-ejecuciones.html#demostracion',base).href);
        assert.equal((await kpi())[0],'30');
        await page.locator('#job-filter').selectOption('ETL Ventas');await page.locator('[data-action="history-apply"]').click();assert.equal((await kpi())[0],'10');
        await page.locator('#run-status').selectOption('Fallido');await page.locator('[data-action="history-apply"]').click();assert.equal((await kpi())[0],'2');
        await page.locator('#sla-input').fill('0');await page.locator('[data-action="history-apply"]').click();assert.equal((await kpi())[0],'2');assert.ok((await page.locator('#demo-message').innerText()).includes('Se conserva'));
        await page.locator('[data-action="reset"]').click();assert.equal((await kpi())[0],'30');
        const historyWait=page.waitForEvent('download');await page.locator('[data-action="export-history"]').click();
        const historyRows=csv.parseCsv(fs.readFileSync(await (await historyWait).path(),'utf8'),';');assert.equal(historyRows.length,31);
        checks.push('LG-011: métricas, filtros, SLA inválido atómico, historial CSV y reset');
        await page.goto(new URL('proyectos/ia-datos.html#demostracion',base).href);
        assert.equal((await kpi())[0],'Gs. 5.017.000');
        for(const value of ['1','2','3','4'])await page.locator('#question-input').selectOption(value);
        await page.locator('#branch-filter').selectOption('S002');
        const guidedWait=page.waitForEvent('download');await page.locator('[data-action="export-guided"]').click();
        const guidedRows=csv.parseCsv(fs.readFileSync(await (await guidedWait).path(),'utf8'),';');assert.equal(guidedRows.length,25);
        await page.locator('[data-action="reset"]').click();assert.equal((await kpi())[0],'Gs. 5.017.000');
        checks.push('LG-010: cinco consultas, evidencia compartida, filtro, exportación y reset');
        await page.goto(new URL('proyectos/automatizacion-excel-csv.html#demostracion',base).href);
        await page.locator('[data-action="sample"]').click();assert.equal((await kpi())[0],'3');
        assert.ok((await page.locator('#csv-preview').inputValue()).includes("'=1+1"));
        await page.locator('#csv-safe').uncheck();assert.ok(!(await page.locator('#csv-preview').inputValue()).includes("'=1+1"));
        await page.locator('#csv-safe').check();
        const fixture='codigo,producto,cantidad,comentario\r\n001, chipá ,3,"Con, coma"\r\n002,Pan,,"Dos\nlíneas"\r\n001, chipá ,3,"Con, coma"\r\n';
        await page.locator('#csv-file').setInputFiles({name:'sintetico.csv',mimeType:'text/csv',buffer:Buffer.from(fixture)});
        await page.waitForFunction(()=>document.querySelector('#demo-message').textContent.includes('3 registros'));
        await page.locator('#csv-trim').check();await page.locator('#csv-dedupe').check();
        await page.locator('#csv-column').selectOption('1');await page.locator('#csv-case').selectOption('upper');
        assert.equal((await kpi())[1],'2');
        const convertedWait=page.waitForEvent('download');await page.locator('[data-action="download"]').click();
        const converted=csv.parseCsv(fs.readFileSync(await (await convertedWait).path(),'utf8'),';');
        assert.equal(converted[1][0],'001');assert.equal(converted[1][1],'CHIPÁ');assert.equal(converted[2][2],'');assert.equal(converted[2][3],'Dos\nlíneas');
        for(const [name,buffer] of [['vacio.csv',Buffer.from('')],['malformado.csv',Buffer.from('a,b\n1\n')],['comillas.csv',Buffer.from('a,b\n"sin cierre')],['codificacion.csv',Buffer.from([0x61,0x0a,0xff])],['archivo.xlsx',Buffer.from('ficticio')],['grande.csv',Buffer.alloc(1048577,65)]]){
            await page.locator('#csv-file').setInputFiles({name,mimeType:'text/csv',buffer});
            await page.waitForFunction(()=>document.querySelector('#demo-message').classList.contains('error'));
            assert.equal(await page.locator('[data-action="download"]').isDisabled(),true,name);
            assert.equal(await page.locator('#csv-preview').inputValue(),'',name);
        }
        await page.locator('[data-action="reset"]').click();
        await page.locator('#csv-delimiter').selectOption(';');
        await page.locator('#csv-file').setInputFiles({name:'puntoycoma.csv',mimeType:'text/csv',buffer:Buffer.from('codigo;texto\n001;Ejemplo\n')});
        await page.waitForFunction(()=>document.querySelector('#demo-message').textContent.includes('1 registros'));
        assert.ok((await page.locator('#csv-preview').inputValue()).includes('001;Ejemplo'));
        await page.locator('[data-action="reset"]').click();assert.equal((await kpi())[0],'—');
        checks.push('LG-012: carga UTF-8, separadores, transformaciones, ceros, vacíos, fórmulas, CSV inválido/vacío/grande/XLSX, exportación y reset');
        await page.goto(new URL('index.html', base).href);
        const allCards = await page.locator('.project-card').count();
        assert.equal(allCards, 12);
        await page.locator('[data-filter="Finanzas"]').click();
        assert.equal(await page.locator('.project-card:visible').count(), 3);
        await page.locator('[data-filter="Todos"]').click();
        assert.equal(await page.locator('.project-card:visible').count(), 12);
        checks.push('Landing: filtros 12 → 3 → 12');
        await page.setViewportSize({width:390,height:844});
        await page.locator('[data-menu-toggle]').click();
        assert.equal(await page.locator('[data-menu-toggle]').getAttribute('aria-expanded'),'true');
        await page.locator('[data-nav] a[href="#proyectos"]').click();
        assert.equal(await page.locator('[data-menu-toggle]').getAttribute('aria-expanded'),'false');
        assert.ok(page.url().endsWith('#proyectos'));
        assert.equal(await page.locator('[data-social="github"]').getAttribute('href'),'https://github.com/lgaray99');
        checks.push('Landing: menú móvil, navegación y perfil GitHub actualizado');
        assert.deepEqual(errors, [], 'Errores de consola/HTTP');
        fs.mkdirSync(path.join(__dirname, '../auditoria-local'), {recursive: true});
        fs.writeFileSync(path.join(__dirname, '../auditoria-local/browser-results.json'), JSON.stringify({checks, errors}, null, 2));
        console.log(`OK: ${checks.length} comprobaciones de navegador; 13 páginas × 3 anchos; sin errores JS/HTTP locales. ${site?'Rutas probadas bajo subdirectorio.':'Servidor externo indicado.'}`);
    } finally { await browser.close();await site?.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
