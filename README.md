# LG Smart BI Web

Landing page estática para LG Smart BI, consultoría especializada en Business Intelligence, Power BI, Data Warehouses, integración de datos, automatización y capacitación.

El sitio está preparado para publicarse en GitHub Pages sin backend, compilación ni dependencias obligatorias.

## Estructura

```text
lgsmartbi-web/
├── index.html
├── styles.css
├── script.js
├── README.md
├── .gitignore
└── assets/
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
