# LG Smart BI Web

Portafolio estático con doce proyectos y demostraciones locales para LG Smart BI, consultoría especializada en Business Intelligence, Power BI, Data Warehouses, integración de datos, automatización y capacitación.

El sitio está preparado para publicarse en GitHub Pages sin backend, compilación ni dependencias obligatorias.

## Estructura

```text
lgsmartbi-web/
├── index.html
├── styles.css
├── script.js
├── README.md
├── .gitignore
├── projects.json
├── proyectos/             # Doce fichas individuales
├── scripts/               # Generador de fichas y tarjetas
├── tests/                 # Motores, enlaces y archivos sintéticos
└── assets/
    ├── css/portfolio.css
    ├── js/                # Motores, interacciones y filtros
    ├── logo/
    │   └── logo-placeholder.svg
    ├── images/
    │   ├── dashboard-placeholder.svg
    │   ├── data-warehouse-placeholder.svg
    │   ├── python-placeholder.svg
    │   └── profile-placeholder.svg
    └── icons/
        └── .gitkeep
```

## Cómo abrir la web localmente

Abrí `index.html` directamente en el navegador.

También podés levantar un servidor estático desde la carpeta:

```bash
python -m http.server 8000
```

Luego ingresá a:

```text
http://localhost:8000
```

## Cómo reemplazar imágenes

Los placeholders están en:

```text
assets/logo/
assets/images/
```

Podés reemplazarlos por imágenes reales manteniendo los mismos nombres, o cambiar las rutas en `index.html`.

Recomendaciones:

- Usar imágenes optimizadas para web.
- Preferir formatos `.webp`, `.jpg`, `.png` o `.svg` según el caso.
- Mantener rutas relativas, por ejemplo `assets/images/imagen.webp`.
- Evitar rutas absolutas como `/assets/images/imagen.webp`.

## Cómo modificar datos de contacto

Editá el objeto `CONFIG` en `script.js`:

```javascript
const CONFIG = {
    whatsappNumber: "",
    email: "lgaray@lgsmartbi.com",
    linkedinUrl: "https://www.linkedin.com/in/luis-garay99/",
    githubUrl: "https://github.com/Diosnel99",
    siteUrl: "https://lgsmartbi.com"
};
```

Cuando se agregue WhatsApp, el número debe ir sin `+`, espacios ni guiones y se pueden volver a conectar los botones a `wa.me`.

También conviene actualizar en `index.html`:

- Los metadatos Open Graph.
- Los datos estructurados JSON-LD.
- El correo fallback del formulario.
- Los perfiles `sameAs`.

## Cómo publicar en GitHub Pages

Desde GitHub:

1. Crear un repositorio llamado `lgsmartbi-web`.
2. Subir estos archivos al repositorio.
3. Ir a `Settings`.
4. Entrar en `Pages`.
5. En `Build and deployment`, elegir `Deploy from a branch`.
6. Seleccionar la rama `main`.
7. Seleccionar la carpeta `/ root`.
8. Guardar.

La URL inicial será similar a:

```text
https://Diosnel99.github.io/lgsmartbi-web/
```

## Cómo conectar el dominio lgsmartbi.com

Después de verificar que GitHub Pages funciona correctamente:

1. Ir a `Repository`.
2. Entrar en `Settings`.
3. Entrar en `Pages`.
4. En `Custom domain`, usar:

```text
www.lgsmartbi.com
```

Configuración DNS prevista:

```text
A     @      185.199.108.153
A     @      185.199.109.153
A     @      185.199.110.153
A     @      185.199.111.153
CNAME www    Diosnel99.github.io
```

No guardes contraseñas, tokens ni datos privados dentro del proyecto.

## Cómo actualizar la página

1. Editar `index.html`, `styles.css` o `script.js`.
2. Probar localmente.
3. Hacer commit de los cambios.
4. Subir a GitHub.
5. GitHub Pages publicará la nueva versión automáticamente.

## Comandos Git sugeridos

```bash
cd lgsmartbi-web
git init
git add .
git commit -m "Crear landing page de LG Smart BI"
git branch -M main
git remote add origin https://github.com/Diosnel99/lgsmartbi-web.git
git push -u origin main
```


## Portafolio y alcance de las demostraciones

Todas las muestras pertenecen a **Horizonte Demo S.A.**, empresa ficticia. Moneda: PYG sin decimales. No se reutilizan datos, código, configuraciones o documentos de clientes. Las demostraciones procesan datos en memoria; no incluyen conexiones externas, persistencia ni backend.

| Código | Proyecto | Estado local |
|---|---|---|
| LG-001 | Conciliación bancaria automatizada | Funcional: referencias, importes, duplicados, excepciones y exportación |
| LG-002 | Conciliación contable ERP vs Libro Mayor | Funcional: cruce bidireccional y exportación, sin ERP conectado |
| LG-003 | Automatización ERP con Python y RPA | Simulación de etapas; no ejecuta Python ni controla ERP |
| LG-004 | Monitor incremental de archivos Parquet | Simulación de eventos; no lee Parquet ni observa carpetas |
| LG-005 | Pipeline ETL y tablas derivadas | Funcional: lote JSON editable, validaciones, rechazos y auditoría CSV |
| LG-006 | Data Warehouse comercial | Funcional: agregados en memoria por sucursal/mes; SQL y modelo estrella conceptuales |
| LG-007 | Plataforma integral BI y Power BI | Simulación de experiencia BI; filtros JavaScript, sin Power BI conectado |
| LG-008 | Control de inventarios y producción | Funcional: BOM, existencias ficticias y faltantes teóricos |
| LG-009 | Conciliación de procesadoras | Funcional: comisión hipotética editable, cruce y exportación |
| LG-010 | Inteligencia artificial aplicada a datos | Simulación de preguntas por reglas; no usa IA/LLM |
| LG-011 | Monitoreo de automatizaciones | Simulación de estados, falla y recuperación; no envía alertas |
| LG-012 | Automatización de archivos Excel y CSV | Funcional para CSV; no admite XLS/XLSX ni macros |

Siete demostraciones funcionales y cinco simulaciones interactivas. Ninguna se presenta como integración productiva. Cada ficha explica problema, solución, arquitectura, tecnologías, beneficios esperados, límites y contacto.

La demostración bancaria independiente indicada para la integración no estaba disponible en la ruta suministrada. LG-001 utiliza el motor sintético independiente revisado; integrar y verificar la demostración anterior sigue pendiente.

### Uso y mantenimiento

- `projects.json`: títulos, categorías, contenido comercial y alcance técnico.
- `python scripts/generar_paginas.py`: actualiza las doce fichas, SVG y tarjetas entre los marcadores `portfolio:cards` de `index.html`; conserva las demás secciones. No editar manualmente las páginas generadas.
- `assets/css/portfolio.css`: estilos compactos sobre la identidad existente, diseño 3/2/1 y entradas accesibles.
- `assets/js/demo-engine.js`: cálculos puros y lectura/serialización CSV.
- `assets/js/demo-ui.js`: controles, validaciones y descargas.
- `assets/js/portfolio-index.js`: filtros por categoría.
- Al cambiar el correo, actualizar `CONFIG` en `script.js`, los fallbacks HTML y el correo de la plantilla en `scripts/generar_paginas.py`, y regenerar.

Las conciliaciones aceptan CSV `referencia;importe`, con importes enteros sin separadores de miles, hasta 20.000 registros por conjunto y 1 MiB combinado. Una referencia repetida se aparta como duplicado, sin emparejarla automáticamente. Las exportaciones conservan todas las referencias del filtro seleccionado.

El ETL admite hasta 20.000 registros JSON y 1 MiB. Rechaza estados distintos de `OK`, IDs ausentes, IDs repetidos, cantidades/precios inválidos e importes no enteros. Los rechazados aparecen en la auditoría. El cálculo de BOM es teórico y no descuenta stock real.

El conversor CSV admite UTF-8, coma, punto y coma o tabulación, hasta 1 MiB y 20.000 registros más encabezado. Exige encabezados únicos no vacíos y filas de ancho uniforme. Soporta comillas, saltos de línea y BOM. La salida usa punto y coma, CRLF y BOM UTF-8. Los códigos y campos vacíos se preservan como texto; CSV no guarda tipos: importar las columnas de códigos como Texto en Excel para conservar ceros iniciales. La protección de fórmulas está activada y se puede desmarcar explícitamente para preservar texto exacto. Las exportaciones de resultados también neutralizan campos textuales que podrían ejecutarse como fórmulas.

### Pruebas locales

Desde la raíz del repositorio:

```powershell
python -m http.server 8000 --bind 127.0.0.1
# En otra terminal:
node tests/test_engine.js
python tests/verificar_enlaces.py
git diff --check
```

Abrir `http://127.0.0.1:8000/`. Node se usa únicamente para pruebas, sin dependencias npm. El sitio funciona como HTML/CSS/JavaScript estático, con rutas relativas compatibles con GitHub Pages y subdirectorios.

Validación realizada el **25/11/2026** sobre la copia local real:

- Trece páginas servidas por HTTP y las doce fichas probadas en navegador a 1440, 800 y 390 px; cuadrícula 3/2/1, sin desbordamiento horizontal ni imágenes rotas.
- Casos conocidos de conciliación, ETL, agregación, BOM y CSV aprobados. ETL inicial: 3 aceptados, 3 rechazados y Gs. 300.000. Ventas válidas: Gs. 695.000 y 18 unidades; Centro: Gs. 420.000.
- Edición de movimientos, filtros, reinicios, JSON sintético editable, BOM, preguntas por reglas y todas las etapas de las tres simulaciones de procesos comprobados.
- Carga de CSV sintético con códigos `001`, campos vacíos, comillas, texto multilínea y fórmula neutralizada; archivo inconsistente rechazado y descarga bloqueada.
- Descargas bancarias, auditoría ETL, consulta analítica y CSV convertido verificadas con lectura independiente mediante Python; archivos de prueba descargados limpiados.
- Menú móvil, navegación, enlaces de contacto y secciones originales revisados; sin errores JavaScript ni avisos de consola observados. El formulario conserva el flujo `mailto`; no se envió correo ni se comprobó el cliente de correo del sistema.
- Barrido de confidencialidad sobre los archivos incorporados y revisión del diff. No se incorporó material privado. No se ejecutó el instalador del paquete de referencia.

Estas pruebas locales no validan conexiones empresariales, despliegue, DNS, entrega de correo ni Power BI/ERP/IA reales. Las fuentes Inter provienen del proveedor de tipografías existente; sin conexión se utiliza la fuente de respaldo del sistema.

### Antes de publicar

Revisar el diff y los textos comerciales, resolver la integración pendiente de la demo bancaria original y confirmar contactos/metadatos. Hacer la aprobación de publicación por separado. Este trabajo no ejecutó `git add`, commits, push, despliegues ni cambios de DNS.

### Auditoría final previa a publicación — 25/11/2026

- Revisados expresamente los 34 archivos nuevos sin rastrear, además de los modificados. Sin credenciales, datos de clientes, rutas privadas, IP internas ni archivos pesados detectados en el sitio.
- Verificadas las trece páginas a 1440, 800 y 390 px: diseño 3/2/1, texto legible, sin desbordamiento horizontal ni imágenes rotas. No se requirió rediseño ni agregar funciones.
- Corregido un fallo reproducido con sumas fuera del rango numérico seguro: ahora el lote se valida antes de sustituir el resultado anterior. También se valida la comisión antes de actualizarla; el rechazo conserva la selección válida. Las pruebas de regresión en navegador no generaron errores de consola.
- Eliminada de LG-003 la mención de reintentos que su simulación no representa. El formulario ahora aclara que prepara un correo y requiere envío manual desde una aplicación configurada.
- Probados filtros, entradas editables, reinicios, recorridos de simulaciones, CSV válido/inválido, protección de fórmulas y siete botones de descarga. Cálculos y archivos exportados contrastados con casos conocidos.
- Títulos y descripciones únicos, un H1 por página, favicon y recursos relativos válidos. Las arquitecturas Python/SQL y las simulaciones ERP/Power BI/IA están identificadas y no acreditan conexiones productivas.
- Capturas de revisión en `auditoria-local/escritorio.jpg` y `auditoria-local/celular.jpg`, excluidas de Git para evitar incorporarlas al sitio publicado.
- Dictamen de código y contenido: **APTO PARA PUBLICAR** como portafolio estático de demostraciones sintéticas. La demo bancaria independiente anterior continúa ausente y no bloquea la demo funcional actual. DNS, TLS, configuración real de GitHub Pages y entrega de correo quedan fuera de esta validación local.
