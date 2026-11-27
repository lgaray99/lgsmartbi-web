# LG Smart BI — portfolio de demostraciones

Sitio estático con doce aplicaciones de demostración, datos sintéticos y motores JavaScript. Conserva la landing, identidad oscura, tipografía Inter y rutas relativas. No requiere backend ni compilación para funcionar en GitHub Pages.

Repositorio público verificado: [lgaray99/lgsmartbi-web](https://github.com/lgaray99/lgsmartbi-web). El remoto local histórico redirige al propietario actual; no se modificó su configuración.

## Abrir localmente

Desde la raíz del repositorio:

```powershell
python -m http.server 8765 --bind 127.0.0.1
```

Abrir `http://127.0.0.1:8765/`. Los motores no usan APIs ni credenciales. Inter conserva el proveedor de tipografías existente y tiene fuente de respaldo si no hay conexión.

## Estado de las doce demostraciones

| Código | Función disponible | Tipo y límite principal |
|---|---|---|
| LG-001 | Banca: fechas, importes, tolerancias, duplicados, ambigüedad y uno a varios | Funcional; sin conexión bancaria |
| LG-002 | Gestión vs cuenta de control del Mayor, asientos y excepciones | Funcional; no registra asientos |
| LG-003 | Cola RPA, etapas, fallos, reintentos y bitácora exportable | Simulador determinista; no abre ERP |
| LG-004 | Eventos de archivos, firmas, cola, errores y bajas en memoria | Simulador determinista; no lee Parquet |
| LG-005 | ETL, auditoría por entrada y upserts incrementales por versión | Funcional; snapshot por pestaña |
| LG-006 | Estrella, dimensiones, claves, consultas y SQL/CSV descargables | Funcional en memoria; sin servidor SQL |
| LG-007 | Ventas, costos, margen, ticket, filtros, SVG y detalle exportable | Dashboard JavaScript; no es Power BI |
| LG-008 | BOM multinivel, unidades, consumos y faltantes | Funcional; sin stock real ni mermas |
| LG-009 | Cupones, comisión, retención, neto, corte y vencimientos | Funcional; tasas/plazos didácticos |
| LG-010 | Cinco consultas guiadas con evidencia exportable | Reglas funcionales; sin IA/LLM |
| LG-011 | Ejecuciones, duraciones, reintentos, filtros y SLA | Tablero funcional; eventos sintéticos |
| LG-012 | CSV local, validaciones, transformaciones y exportación | Funcional para CSV; sin XLS/XLSX |

Diez demostraciones con cálculo/consulta funcional y dos simuladores de procesos. Ninguna es un sistema empresarial productivo. Problema, solución técnica, arquitectura, beneficio y límites están visibles en cada ficha. La demostración bancaria previa ajena al checkout no se incorporó; se conserva el motor independiente y su formato CSV anterior.

## Datos y reglas compartidas

Empresa ficticia **DemoComercial S.A.**; PYG enteros, sin impuestos ni descuentos. Generación determinista sin aleatoriedad: seis meses, ocho documentos por mes y dos líneas por documento; anulados y anomalías explícitas.

- Origen: 101 entradas; ETL base: 84 aceptadas y 17 rechazadas; 42 documentos válidos.
- Ventas: **Gs. 5.017.000**; costos: **Gs. 2.993.000**; margen bruto: **Gs. 2.024.000**; 255 unidades comerciales.
- BI, DW y consultas guiadas usan la misma versión base. Los cambios de escenarios ETL no alteran silenciosamente otras pestañas.
- El ETL conserva auditoría de cada entrada. En un lote, prevalece la primera ocurrencia válida de un ID y se rechazan las repetidas. Incremental: insertar nuevos, actualizar solo versiones posteriores, omitir idénticas/antiguas y rechazar conflictos de igual versión. Anulados se rechazan; no se implementa CDC de bajas. Se puede descargar el snapshot JSON y volver a cargarlo como lote.
- Banca y contabilidad reutilizan algunas operaciones comerciales y añaden excepciones independientes. Procesadoras y producción tienen escenarios separados identificados; sus totales no representan el total de ventas de BI. Los costos comerciales son históricos, no una valorización del BOM.
- Conciliación: cada fila se utiliza una vez. Referencias repetidas idénticas se apartan; uno a varios solo admite una combinación inequívoca entre hasta diez candidatos.
- CSV: UTF-8, coma/punto y coma/tabulación, hasta 1 MiB y 20.000 registros; códigos y vacíos conservados como texto. Transformaciones y exclusiones opcionales. Protección de fórmulas por defecto, desactivable explícitamente. CSV no almacena tipos de Excel.

`downloads/` contiene cinco tablas CSV simples, el origen JSON, modelo PostgreSQL con datos, consultas, ejemplos DAX, una función Power Query y guía de reproducción. El SQL se probó en PostgreSQL WASM (PGlite), sin servidor ni credenciales. **No existe PBIX/PBIP creado y validado; DAX/M no se ejecutaron en Power BI Desktop.**

## Mantenimiento

- `projects.json`: contenido técnico/comercial y estados.
- `scripts/generar_paginas.py`: regenera las doce fichas, ilustraciones y tarjetas; preserva el resto de la landing entre marcadores.
- `assets/js/commercial-data.js`: generación sintética determinista.
- Motores `commercial-engine.js`, `finance-engine.js`, `operations-engine.js`: reglas puras.
- `demo-engine.js`: contratos anteriores y parser/transformador CSV; `demo-common.js`: controles, tablas y descargas compartidas.
- Vistas `commercial-ui.js`, `finance-ui.js`, `operations-ui.js`, `demo-ui.js`: interacciones sin dependencias externas.
- `assets/css/portfolio.css`: estilos compartidos sobre `styles.css`.
- `script.js`: contacto y navegación originales; perfil GitHub actualizado. Cambios de correo requieren actualizar CONFIG, fallbacks de index y plantilla del generador.

Después de cambiar datos o catálogo:

```powershell
node scripts/generar_datasets.js
python scripts/generar_paginas.py
```

## Pruebas y revisión

Node solo se necesita para generar datasets y probar; la web publicada usa JavaScript nativo. Dependencias **de desarrollo**: Playwright y PGlite, con versiones resueltas en package-lock.

```powershell
npm ci --ignore-scripts
npm test
npm run test:browser
npm run check:links
npm run check:privacy
git diff --check
```

El navegador de pruebas usa Edge instalado en Windows; en otros sistemas requiere Chromium de Playwright. Levanta y cierra su propio servidor de pruebas bajo un subdirectorio. `BASE_URL` permite usar otro servidor estático. No toca sesiones personales ni envía mensajes. Capturas y resultados locales se guardan en `auditoria-local/`, excluido de Git.

Resultados y estado por proyecto: [REVISION_FINAL.md](REVISION_FINAL.md). Checkpoints: [REGRESIONES.md](REGRESIONES.md). Las pruebas no validan conexiones reales, despliegue, DNS/TLS, entrega de correo, Power BI Desktop ni PostgreSQL nativo.

El cierre V2 del 27/11/2026 autoriza un único commit local con las mejoras verificadas. La publicación requiere autorización por separado; no se realizan push, despliegues ni cambios de infraestructura. La revalidación y la corrección de cierre están documentadas en `REVISION_FINAL.md`.
