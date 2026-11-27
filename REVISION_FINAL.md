# LG Smart BI — revisión final local, 25/11/2026

**APTO PARA PUBLICAR como portafolio estático de demostraciones sintéticas**, sujeto a la revisión del propietario. No se publicó. El dictamen corresponde al código local y al alcance declarado; no acredita un sistema empresarial productivo ni una configuración de hosting.

## Resumen ejecutivo

Se evolucionaron las doce demos conservando landing, navegación, Inter y paleta oscura. Las mayores mejoras demostrativas están en LG-007 (análisis comercial), el recorrido LG-005 → LG-006 → LG-007 y las tres conciliaciones. Se separaron motores puros y vistas; cada ficha carga solo los módulos necesarios. No hay frameworks ni librerías nuevas en el sitio publicado.

DemoComercial S.A. es ficticia. ETL, Warehouse, BI y consultas guiadas comparten el mismo origen determinista: 101 entradas, 84 aceptadas, 17 rechazadas y 42 documentos válidos. Ventas **5.017.000 PYG**, costos **2.993.000**, margen **2.024.000** y **255 unidades comerciales**. Los escenarios financieros y de producción adicionales están identificados y no se presentan como el total de operaciones comerciales.

## Estado por proyecto

Todas las filas de esta tabla tienen estado local **implementado y verificado dentro del alcance indicado**. Todas admiten reinicio y exportación de datos, resultados o actividad, según su naturaleza.

| Código | Tipo | Funcionalidades añadidas o ampliadas | Verificación específica ejecutada | Limitaciones |
|---|---|---|---|---|
| LG-001 | Funcional | Movimientos editables, tolerancias PYG/días, coincidencias exactas, diferencias, faltantes, duplicados, uno a varios único, ambigüedad, filtros y CSV | Casos conocidos; conservación de cada fila; parámetros e importación inválidos; filtro y descarga; HTML tratado como texto; reinicio | Sin banco conectado; agrupación limitada a diez candidatos; formato anterior sin fechas conserva esa limitación. Demo privada anterior ajena al checkout no incorporada. |
| LG-002 | Funcional | Gestión vs cuenta Clientes del Mayor; asientos con contrapartida, diferencias, pendientes, duplicados, filtros y CSV | Casos contables; cuenta de control separada de contrapartida; tolerancias, error atómico, descarga y reinicio | No registra asientos ni consulta ERP; un asiento balanceado puede no estar conciliado. |
| LG-003 | Simulador determinista | Cola RPA, etapas, resultado por tarea, errores transitorios/permanentes, reintentos 0–3 y bitácora | Secuencia reproducible; 0/1/3 reintentos; límite de intentos; actividad CSV y reinicio | No controla ERP ni ejecuta Python; reportes y reloj T+ son modelados. |
| LG-004 | Simulador determinista | Altas, cambios, bajas, firmas, cola, obsoletos, idempotencia, errores y materializado confirmado | Eventos idénticos ignorados; error no pisa salida; recuperación; baja; evento inválido; reinicio | No lee Parquet ni supervisa carpetas; firmas y filas son metadatos sintéticos. |
| LG-005 | Funcional | JSON editable, tipado, normalización, duplicados, rechazos por entrada, métricas, carga completa/incremental, auditoría CSV y snapshot JSON | 84/17 conocidos; inserción/actualización; repetición idempotente; versiones antiguas/conflictos; JSON inválido; auditoría conserva las 101 entradas; formato simple anterior conservado | Estado por pestaña; sin CDC de bajas; anulados rechazados; escenarios editados no alteran otras demos. |
| LG-006 | Funcional en memoria | Estrella con cuatro dimensiones, PK/FK, exploración de tablas, consultas por mes/sucursal/producto/cliente, comparación operativo/analítico y SQL/CSV | Huérfanos y medidas inválidas rechazados; SQL reproducido dos veces en PostgreSQL WASM; agregados coinciden con JS; filtros y CSV | Navegador sin servidor SQL; no se probó PostgreSQL nativo. Conteos distintos por producto no son aditivos. |
| LG-007 | Dashboard JavaScript funcional | Ventas, costos, margen/% y ticket, unidades, clientes/productos, cinco filtros combinables, SVG, detalle y exportación, guías de modelado | KPIs conocidos; recálculo independiente de indicadores y agrupaciones; filtros, vacío, rango inválido, reinicio y lectura independiente de CSV | No es Power BI; no hay PBIX/PBIP validado; DAX/M pendientes de ejecución en Desktop. |
| LG-008 | Calculadora funcional | Productos/recetas compartidos, BOM multinivel editable, conversiones exactas, movimientos, diferencias, stock y faltantes | 20 chipás: 4,6 kg harina, 1,6 kg queso y 20 empaques; combo sin doble conteo; ciclos/unidades inválidos; resultado anterior preservado; CSV | Sin mermas, reserva ni stock real; costos históricos comerciales separados de valorización BOM. |
| LG-009 | Funcional | Ventas/cupones, liquidaciones, comisión/retención configurables, neto, corte, plazos y pendientes/vencidas | 2 coincidencias base; diferencia conocida; redondeos exactos; retención; corte/vencimiento; tasa inválida y reinicio | Tasas/plazos ficticios; días calendario; sin reglas fiscales/contractuales reales ni conexión externa. |
| LG-010 | Reglas analíticas funcionales | Cinco consultas guiadas con filtros, ranking y evidencia exportable; arquitectura futura con herramientas/LLM | Valores coinciden con BI; consultas y filtros probados; evidencia descargada; reinicio | No usa IA ni comprende texto libre; SQL mostrado como equivalencia, no ejecutado por la web. |
| LG-011 | Tablero funcional de eventos sintéticos | 30 ejecuciones, estados, duraciones, errores, reintentos, historial de intentos, SLA y filtros | Métricas conocidas; filtro de proceso/estado/fechas; SLA inválido atómico; CSV y reinicio | No supervisa tareas ni envía alertas; duraciones pertenecen al dataset. |
| LG-012 | Herramienta CSV funcional | Carga local UTF-8, separador, vista previa, recorte, transformación de texto por columna, deduplicación/exclusión explícitas y descarga segura | Ceros iniciales, campos vacíos, comillas/multilínea, fórmulas con protección activada/desactivada; CSV vacío/malformado/grande, UTF-8 inválido y XLSX rechazados; exportación y reinicio | Máximo 1 MiB/20.000 registros; no interpreta XLS/XLSX; CSV no almacena tipos de Excel. |

## Calidad comprobada

- **43 tests automatizados nuevos aprobados; 0 fallidos en la pasada final**, además de la suite anterior `tests/test_engine.js`, conservada y aprobada. No se suman aserciones individuales para inflar el conteo.
- **53 grupos de comprobaciones de navegador aprobados** en Edge headless: 13 páginas × 1440/800/390 px (39 visitas), flujos de las doce demos, filtros de la landing y menú móvil. El test inicia y cierra un servidor local montado en subdirectorio; rutas relativas y recursos dinámicos resuelven allí.
- Enlaces internos, anclas y recursos estáticos correctos. Sin errores JavaScript/HTTP locales observados, imágenes rotas ni desbordamiento horizontal global. Las tablas amplias conservan desplazamiento interno accesible. Capturas de BI y CSV revisadas visualmente en móvil/escritorio.
- Sintaxis verificada en 19 archivos JavaScript nuevos/modificados, Python y JSON; `git diff --check` sin errores. Regeneración determinista de páginas y datasets comprobada.
- SQL de tablas/datos y consultas ejecutado en PostgreSQL WASM (PGlite), incluidas PK/FK, repetición sin duplicar y comparación con JavaScript. No es una validación de instalación PostgreSQL nativa.
- Auditoría estática de 66 archivos nuevos/modificados: sin hallazgos de credenciales, rutas privadas, IP internas o formatos confidenciales. No se leyó contenido privado de clientes ni se incorporaron capturas/código/datos empresariales. El barrido heurístico se complementó con revisión de diffs y archivos creados.
- Fallos detectados y corregidos durante los ciclos: clasificación temporal en conciliación agrupada; detección cuadrática de IDs repetidos; historial inválido; encabezados CSV sin columnas; protección del materializado ante errores; alineación/legibilidad móvil; un paréntesis sobrante en una prueba nueva de datasets. La pasada final repitió las comprobaciones afectadas.

## Archivos entregados

**Nuevos motores/vistas compartidos:** `assets/js/commercial-data.js`, `commercial-engine.js`, `commercial-ui.js`, `demo-common.js`, `finance-engine.js`, `finance-ui.js`, `operations-engine.js`, `operations-ui.js`.

**Datasets/documentación descargables:** `downloads/ventas.csv`, `productos.csv`, `clientes.csv`, `sucursales.csv`, `fechas.csv`, `origen-ventas.json`, `modelo-postgresql.sql`, `consultas.sql`, `medidas.dax`, `cargar-csv.pq`, `modelo-powerbi.md`.

**Scripts y pruebas nuevos:** `scripts/generar_datasets.js`, `schema-postgresql.sql`, `verificar_confidencialidad.py`; `tests/commercial.test.js`, `finance.test.js`, `operations.test.js`, `csv.test.js`, `datasets.test.js`, `postgresql.test.js`, `browser-checks.js`; `package.json`, `package-lock.json` (solo herramientas de desarrollo).

**Documentación nueva:** `REGRESIONES.md` y este informe. **Modificados:** README, `.gitignore`, catálogo `projects.json`, `index.html`, `script.js`, `assets/css/portfolio.css`, motores/vista anteriores `demo-engine.js`/`demo-ui.js`, generador de páginas, las doce fichas HTML y doce ilustraciones SVG (empresa/estado). `styles.css` y las demás secciones funcionales de la landing se conservaron.

Capturas/resultados de revisión y `node_modules` quedan excluidos de Git. No hay archivos XLSX, PBIX/PBIP ni binarios de datos empresariales nuevos.

## Git y pendientes de la auditoría del 25/11/2026

- Rama **main**, commit base **4da689d**, sin cambiar de rama. El árbol estaba limpio al comenzar.
- Identidad verificada: [lgaray99/lgsmartbi-web](https://github.com/lgaray99/lgsmartbi-web). Remoto local conservado: `https://github.com/Diosnel99/lgsmartbi-web.git`, redirigido por GitHub al propietario actual. Los enlaces públicos del sitio ya usan el usuario actual.
- 33 archivos modificados y 33 nuevos pendientes de revisión y confirmación; 0 archivos preparados en staging. El detalle exacto se obtiene con `git status --short`; todo archivo cambiado está agrupado arriba.
- Durante la implementación inicial del 25/11/2026 no se realizaron commits, push, despliegues, cambios de DNS ni acceso a producción. La carpeta inicial de ampliación permanece intacta.
- Pendientes fuera de alcance validable: abrir y validar DAX/M en Power BI Desktop, producir un PBIX/PBIP si se desea; comprobar PostgreSQL nativo; revisar hosting/DNS/TLS y entrega de correo al autorizar una publicación. No se afirma que esas pruebas se ejecutaron.

No quedan fallos locales conocidos que bloqueen publicar el alcance estático declarado. Los límites anteriores se muestran en las fichas y no se ocultan como funcionalidades productivas.

## Preparación de publicación V2 — 27/11/2026

- Identidad pública reconfirmada: `lgaray99/lgsmartbi-web`. `git fetch origin` completado; `main` y `origin/main` coinciden en el commit base `4da689d11f6b782962dd0990761b4d202fd5363c`, con divergencia 0/0 y sin archivos en conflicto. No se requirió integración remota.
- Revisión repetida sobre los **66 archivos pendientes**, incluidos los nuevos. Las doce fichas, sus motores, ilustraciones, recursos locales, cinco CSV, origen JSON, SQL y documentación reproducible están incluidos. `node_modules/` y `auditoria-local/` permanecen excluidos.
- Bloqueo detectado y corregido antes del commit: una referencia con 500 movimientos por lado producía `RangeError: Maximum call stack size exceeded` al construir todas las parejas de fechas. El cálculo ahora usa los extremos temporales de cada conjunto, sin producto cartesiano ni expansión masiva de argumentos. Mantiene las reglas y estados anteriores; no agrega funcionalidades.
- Prueba nueva aprobada con **500 y 20.000 movimientos por lado**, fecha máxima conocida y movimientos sin fecha. El escenario de 500/500 también se procesó correctamente en la interfaz bancaria.
- Revalidación posterior a la corrección: **44 tests automatizados aprobados, 0 fallidos**, además de la suite anterior; **53 grupos de comprobaciones en navegador aprobados**, incluidas las 13 páginas a 1440/800/390 px y rutas bajo subdirectorio; enlaces y recursos correctos; barrido de confidencialidad sin hallazgos.
- Dictamen de cierre: **APTO PARA PUBLICAR** dentro del alcance estático y sintético documentado. DAX/M en Desktop y PostgreSQL nativo conservan las limitaciones anteriores.
- Único commit local autorizado: `feat: mejorar demos interactivas de los 12 proyectos LG Smart BI`. Su hash y la comprobación final del árbol limpio se informan después de crearlo; pueden consultarse con `git log -1` y `git status`.
- Sin push, publicación, despliegue ni modificación de DNS.
