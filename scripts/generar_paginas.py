#!/usr/bin/env python3
"""Genera páginas independientes sin herramientas de compilación web."""
import html, json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
projects = json.loads((ROOT/'projects.json').read_text(encoding='utf-8'))

def esc(value): return html.escape(str(value), quote=True)

def status_class(project): return {'functional':'functional','simulation':'simulation','concept':'concept'}[project['type']]

def picture(p): return f'assets/images/{p["id"].lower()}.svg'

def status_link(p):
    if p['type']=='functional': return 'Ver demostración', f'proyectos/{p["slug"]}.html#demostracion'
    if p['type']=='simulation': return 'Ver simulación', f'proyectos/{p["slug"]}.html#demostracion'
    return '', ''

def card(p):
    action, href = status_link(p)
    return f'''<article class="project-card" data-category="{esc(p['category'])}">
        <img src="{picture(p)}" alt="Ilustración sintética del proyecto {esc(p['title'])}" loading="lazy" width="520" height="248">
        <div class="project-content">
            <span class="project-code">{esc(p['id'])} · {esc(p['category'])}</span>
            <h3>{esc(p['title'])}</h3>
            <p>{esc(p['summary'])}</p>
            <span class="status-tag {status_class(p)}">{esc(p['status'])}</span>
            <p class="tech-line">{esc(' · '.join(p['technologies'][:4]))}</p>
            <div class="project-actions"><a class="btn btn-secondary" href="proyectos/{esc(p['slug'])}.html">Ver proyecto</a>{f'<a class="btn btn-primary" href="{esc(href)}">{action}</a>' if action else ''}</div>
        </div>
    </article>'''

card_markup = '\n'.join(card(p) for p in projects)
home = ROOT/'index.html'
source = home.read_text(encoding='utf-8')
start, end = '<!-- portfolio:cards:start -->', '<!-- portfolio:cards:end -->'
if source.count(start) != 1 or source.count(end) != 1:
    raise ValueError('No se encuentran marcadores únicos del catálogo; no se modifica index.html')
a, b = source.index(start) + len(start), source.index(end)
home.write_text(source[:a] + '\n' + card_markup + '\n                ' + source[b:], encoding='utf-8')

for p in projects:
    arch = ''.join(f'<span>{esc(v)}</span>' + ('<b aria-hidden="true">→</b>' if i != len(p['architecture'])-1 else '') for i,v in enumerate(p['architecture']))
    benefits = ''.join(f'<li>{esc(x)}</li>' for x in p['benefits'])
    techs = ''.join(f'<span>{esc(x)}</span>' for x in p['technologies'])
    action = 'Demostración funcional' if p['type']=='functional' else ('Simulación interactiva' if p['type']=='simulation' else 'Proyecto conceptual')
    script_names = ['demo-engine', 'demo-common']
    if p['id'] == 'LG-012':
        script_names += ['demo-ui']
    else:
        script_names += ['commercial-data', 'commercial-engine']
        if p['id'] in ('LG-001', 'LG-002', 'LG-009'):
            script_names += ['finance-engine', 'finance-ui']
        elif p['id'] in ('LG-003', 'LG-004', 'LG-008', 'LG-011'):
            script_names += ['operations-engine', 'operations-ui']
        else:
            script_names += ['commercial-ui']
    script_markup = '\n    '.join(f'<script src="../assets/js/{name}.js"></script>' for name in script_names)
    content = f'''<!doctype html>
<html lang="es">
<head>
    <meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
    <meta name="theme-color" content="#08111F">
    <meta name="description" content="{esc(p['summary'])}">
    <title>{esc(p['id'])} · {esc(p['title'])} | LG Smart BI</title>
    <link rel="icon" href="../assets/logo/logo-placeholder.svg" type="image/svg+xml">
    <link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="../styles.css"><link rel="stylesheet" href="../assets/css/portfolio.css">
</head>
<body class="case-page">
    <a class="skip-link" href="#main">Saltar al contenido</a>
    <header class="case-header"><div class="case-container case-header-inner">
        <a class="case-brand" href="../index.html">LG Smart BI</a>
        <a href="../index.html#proyectos">Volver al portafolio</a>
    </div></header>
    <main id="main" class="case-container">
        <section class="case-hero" aria-labelledby="case-title">
            <span class="project-code">{esc(p['id'])} / {esc(p['category'])}</span>
            <h1 id="case-title">{esc(p['title'])}</h1>
            <p class="case-lead">{esc(p['summary'])}</p>
            <span class="status-tag {status_class(p)}">{esc(p['status'])}</span>
            <div class="case-tags">{techs}</div>
        </section>
        <img class="case-illustration" src="../{picture(p)}" alt="Arquitectura ilustrativa de {esc(p['title'])}" width="520" height="248">
        <div class="case-grid">
            <div class="case-main">
                <section class="case-card"><h2>Problema empresarial</h2><p>{esc(p['problem'])}</p></section>
                <section class="case-card"><h2>Solución técnica</h2><p>{esc(p['solution'])}</p><p class="demo-small">Implementación independiente de demostración. La experiencia y el enfoque técnico se presentan sin reutilizar código o datos de clientes.</p></section>
                <section class="case-card"><h2>Arquitectura</h2><div class="architecture" aria-label="Etapas de arquitectura">{arch}</div></section>
            </div>
            <aside class="case-side" aria-label="Información del proyecto">
                <section class="case-card"><h2>Beneficios esperados</h2><ul>{benefits}</ul></section>
                <section class="case-card"><h2>Alcance y límites</h2><p>{esc(p['limitations'])}</p></section>
            </aside>
        </div>
        <section id="demostracion" class="demo-shell" aria-labelledby="demo-title">
            <h2 id="demo-title">{action} — entorno ficticio</h2>
            <p class="demo-description">Empresa ficticia: DemoComercial S.A. · Moneda: guaraníes (PYG), sin decimales. Todos los nombres, referencias e importes son sintéticos. Las operaciones ocurren en el navegador y no acceden a infraestructura empresarial.</p>
            <noscript><p>Activá JavaScript para ejecutar esta demostración. La ficha técnica permanece disponible.</p></noscript>
            <div data-demo="{esc(p['id'])}"><p>Cargando demostración local…</p></div>
        </section>
        <section class="case-card" style="margin-bottom:24px"><h2>¿Necesitás una solución similar?</h2>
          <p>Podemos diseñar una implementación adaptada a las fuentes, procesos y controles de tu empresa.</p>
          <a class="btn btn-primary" href="mailto:lgaray@lgsmartbi.com?subject={esc(p['id'])}%20-%20Consulta%20LG%20Smart%20BI">Consultar por correo</a>
          <a class="btn btn-secondary" href="../index.html#contacto">Otras formas de contacto</a>
        </section>
    </main>
    <footer class="case-footer"><div class="case-container">LG Smart BI · Portafolio técnico · Paraguay · <a href="../index.html#proyectos">Regresar a proyectos</a></div></footer>
    {script_markup}
</body>
</html>
'''
    (ROOT/'proyectos'/f'{p["slug"]}.html').write_text(content,encoding='utf-8')
    # Cada caso usa un esquema vectorial propio, sin capturas ni recursos de clientes.
    motifs = {
        'LG-001': '<path d="M115 105h80v94h-80z M325 105h80v94h-80z M130 125h50m-50 16h50m-50 16h30m175-32h50m-50 16h50m-50 16h30 M215 150h90m-15-12 15 12-15 12"/><path d="m140 179 9 9 19-22m175 13 9 9 19-22" stroke="#7CD6AA"/>',
        'LG-002': '<path d="M104 110h130v85H104z M286 110h130v85H286z M104 135h130m52 0h130M148 110v85m180-85v85M115 151h22m23 0h60m-105 24h22m23 0h60m79-24h22m23 0h60m-105 24h22m23 0h60M245 149h29m-29 12h29"/>',
        'LG-003': '<rect x="166" y="106" width="188" height="95" rx="14"/><path d="M260 106V89m-9 0h18m-62 69h22m62 0h22m-72 24h38m-113-30h-21v30h21m188-30h21v30h-21"/><circle cx="221" cy="143" r="9"/><circle cx="299" cy="143" r="9"/>',
        'LG-004': '<path d="M105 125v69h98v-69z M105 125v-17h40l14 17 M243 129h51m-12-11 12 11-12 11 M243 177h51m-12-11 12 11-12 11"/><ellipse cx="365" cy="116" rx="45" ry="14"/><path d="M320 116v69c0 20 90 20 90 0v-69m-90 35c0 20 90 20 90 0"/>',
        'LG-005': '<path d="M90 115h85v75H90z M225 115h70v75h-70z M345 115h85v75h-85z M175 151h50m70 0h50 M105 135h55m-55 17h40m-40 17h55 M240 133l13 13-13 13m22 10h18"/><path d="m362 152 13 13 33-35" stroke="#7CD6AA"/>',
        'LG-006': '<rect x="218" y="124" width="84" height="58" rx="6"/><path d="M125 101h58v35h-58z M337 101h58v35h-58z M125 175h58v35h-58z M337 175h58v35h-58z M183 119l35 23m84 0 35-23m-154 73 35-23m84 0 35 23"/>',
        'LG-007': '<rect x="103" y="100" width="314" height="108" rx="7"/><path d="M103 121h314M122 141h65v46h-65z M207 141h45m-45 15h45m-45 15h27M275 187v-32h25v32m13 0v-53h25v53m13 0v-71h25v71"/>',
        'LG-008': '<path d="m260 98 40 22-40 22-40-22z M220 120v38l40 22 40-22v-38m-40 22v38M260 180v17M260 197H143m117 0h117M143 180v30m234-30v30"/><path d="M110 146h65v34h-65z M345 146h65v34h-65z"/>',
        'LG-009': '<rect x="100" y="112" width="132" height="80" rx="8"/><path d="M100 136h132m-113 35h37m86-16h61m-12-11 12 11-12 11"/><circle cx="365" cy="154" r="45"/><path d="m344 154 14 14 28-32" stroke="#7CD6AA"/>',
        'LG-010': '<path d="M112 112h128v65h-85l-28 20v-20h-15z M280 112h128v65H295l-15 20z M132 134h85m-85 20h55M299 134h88m-88 20h60"/><circle cx="260" cy="94" r="7"/>',
        'LG-011': '<path d="M100 170h62l18-44 30 70 30-91 27 65h44l19-27 16 27h74"/><path d="M100 106v102h320"/><circle cx="330" cy="143" r="6" stroke="#FFC2BF"/>',
        'LG-012': '<path d="M125 100h96v105h-96z M299 100h96v105h-96z M139 128h68m-68 20h68m-68 20h68m-46-40v60m24-60v60M313 128h68m-68 20h68m-68 20h68m-46-40v60m24-60v60M235 151h50m-12-11 12 11-12 11"/>'
    }
    mode = 'MOTOR LOCAL' if p['type']=='functional' else 'SIMULACIÓN'
    svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 520 248" role="img" aria-label="Esquema ilustrativo de {esc(p['title'])}"><defs><linearGradient id="g" x2="1" y2="1"><stop stop-color="#0D1B2A"/><stop offset="1" stop-color="#132C49"/></linearGradient></defs><rect width="520" height="248" fill="url(#g)"/><g stroke="#39A9DB" opacity=".1"><path d="M0 80H520M0 160H520M65 0V248M195 0V248M325 0V248M455 0V248"/></g><text x="24" y="33" fill="#65C5EF" font-family="Inter,Arial" font-size="14" font-weight="700">{esc(p['id'])} · {esc(p['category'])}</text><text x="24" y="57" fill="#CBD9E6" font-family="Inter,Arial" font-size="12">{mode} · DATOS SINTÉTICOS</text><g fill="none" stroke="#65C5EF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">{motifs[p['id']]}</g><text x="24" y="232" fill="#A9B6C4" font-family="Inter,Arial" font-size="11">LG SMART BI / DEMOCOMERCIAL S.A.</text></svg>'''
    (ROOT/'assets'/'images'/f'{p["id"].lower()}.svg').write_text(svg,encoding='utf-8')

print(f'Se generaron {len(projects)} páginas, {len(projects)} ilustraciones y el catálogo de tarjetas.')
