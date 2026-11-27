# Checkpoints de desarrollo — 25/11/2026

Repositorio real localizado fuera de la carpeta inicial de referencia. Identidad pública verificada con GitHub: `lgaray99/lgsmartbi-web` (el remoto histórico redirige). Inicio: rama `main`, commit `4da689d`, árbol limpio. No se consultó contenido privado de clientes. La ampliación inicial permanece intacta.

| Checkpoint | Cambio | Pruebas ejecutadas | Resultado / pendiente |
|---|---|---|---|
| Base | Sin modificaciones funcionales | Motor anterior; enlaces; 13 páginas HTTP × 1440/800/390 px; filtros landing | Motor y enlaces correctos; 40 comprobaciones navegador aprobadas. La carpeta inicial de referencia era incompleta, no era el checkout. |
| LG-007 | Dataset compartido, seis meses, KPIs consistentes, filtros, SVG, exportación, guía DAX/M | 8 pruebas nuevas Node; motor anterior; sintaxis; enlaces y regresión de 13 páginas | Motor y render aprobados. DAX/M sin ejecutar en Power BI Desktop; sin PBIX/PBIP. |
| LG-005/006 | ETL con auditoría completa, carga incremental versionada, estrella PK/FK, CSV y PostgreSQL reproducible | 14 tests Node actuales + suite anterior; SQL ejecutado dos veces en PostgreSQL WASM (PGlite); 43 comprobaciones navegador; enlaces | 84 aceptados / 17 rechazos; incremental 1 inserción + 1 actualización, repetición sin duplicar; SQL y JS coinciden. JSON inválido conserva snapshot. No valida PostgreSQL nativo ni Power BI Desktop. |
| LG-001/002/009 | Conciliación monetaria entera, fechas, tolerancias, duplicados, ambigüedad y netos con tasas configurables | 10 tests financieros; regresión completa de 24 tests + suite anterior; 46 comprobaciones navegador; enlaces | Exportaciones filtradas, errores atómicos y reinicios aprobados. Corregidos clasificación por fechas y costo cuadrático de detección de IDs repetidos. Sin conexión bancaria/contable real. |
| LG-003/004 | Máquinas de estados deterministas, colas, errores, reintentos, firmas y bajas en memoria | 6 tests nuevos; regresión completa de 30 tests + suite anterior; 13 páginas × 3 anchos | Escenarios y límites verificados. No ejecutan ERP, Python ni lectura Parquet. |
| LG-008/011 | BOM multinivel con conversiones exactas, ciclos y faltantes; historial de ejecuciones y SLA | 6 pruebas nuevas; suite completa; flujos reales de navegador y exportaciones | BOM 20 chipás: 4,6 kg harina / 1,6 kg queso / 20 empaques. Ciclo y SLA inválido conservan el resultado anterior. |
| LG-010/012 | Reglas guiadas con evidencia; CSV local con transformaciones explícitas y resguardo de códigos | 1 test guiado + 4 CSV + 2 de datasets; todos los motores y navegador | Casos de vacío, formato, codificación, tamaño y XLSX rechazados. Protecciones de fórmulas comprobadas activadas y desactivadas. |
| Cierre | Subdirectorios, recursos dinámicos, menú móvil, documentación y confidencialidad | 43 tests nuevos + suite anterior; 53 grupos de comprobaciones navegador; enlaces, sintaxis y barrido de archivos cambiados | Resultados detallados en REVISION_FINAL.md. Corregida una sintaxis del test de datasets antes de repetir y aprobar la suite. |

## Cierre V2 — 27/11/2026

Fetch de origin completado: main y origin/main en 4da689d, sin cambios remotos pendientes ni conflictos. Revisados los 66 archivos modificados/nuevos, incluidos todos los untracked; dependencias y capturas locales excluidas del commit.

Bloqueo reproducido: 500 movimientos por lado con una misma referencia causaban `RangeError` por el producto cartesiano de fechas y su expansión en `Math.max`. Corregido mediante extremos de fecha por conjunto, en tiempo lineal, sin cambiar reglas de conciliación. Regresión automatizada aprobada con 500 y 20.000 movimientos por lado, más el caso sin fechas; carga de 500/500 verificada también en navegador.

Revalidación posterior: **44 tests aprobados y 0 fallidos**, suite anterior aprobada, **53 grupos de comprobaciones de navegador aprobados**, enlaces de las 13 páginas correctos y barrido de confidencialidad sin hallazgos. Sin funcionalidades nuevas. Se prepara únicamente el commit local autorizado, sin push ni publicación.

Los resultados del navegador se guardan localmente en `auditoria-local/browser-results.json` (excluido de Git). El test HTTP levanta y cierra su propio servidor estático en un subdirectorio; ninguna prueba verifica infraestructura productiva.
