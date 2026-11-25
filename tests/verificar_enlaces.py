#!/usr/bin/env python3
"""Valida enlaces internos y recursos locales de la landing y sus doce casos."""
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlsplit, unquote
import sys, json

ROOT = Path(__file__).resolve().parents[1]
PAGES = [ROOT/'index.html', *sorted((ROOT/'proyectos').glob('*.html'))]
class Reader(HTMLParser):
    def __init__(self): super().__init__(); self.ids=set(); self.links=[]; self.duplicates=[]
    def handle_starttag(self, tag, attrs):
        values = dict(attrs)
        if 'id' in values:
            if values['id'] in self.ids: self.duplicates.append(values['id'])
            self.ids.add(values['id'])
        for kind in ('src','href'):
            if values.get(kind): self.links.append((kind,values[kind]))

cache={}
def read(page):
    if page not in cache:
        parser=Reader(); parser.feed(page.read_text(encoding='utf-8')); cache[page]=parser
    return cache[page]

errors=[]
catalog=json.loads((ROOT/'projects.json').read_text(encoding='utf-8'))
if len(catalog)!=12 or len(PAGES)!=13: errors.append('Se requieren doce fichas y la landing')
for p in catalog:
    if not (ROOT/'proyectos'/f"{p['slug']}.html").exists(): errors.append(f"Falta ficha {p['id']}")
for page in PAGES:
    if not page.exists(): errors.append(f'No existe: {page}'); continue
    doc=read(page)
    if doc.duplicates: errors.append(f'IDs duplicados en {page.name}: {doc.duplicates}')
    for kind,link in doc.links:
        parsed=urlsplit(link)
        if parsed.scheme or parsed.netloc or link.startswith('//'): continue
        local_path=unquote(parsed.path)
        target=(page.parent/local_path).resolve() if local_path else page
        if target.is_dir(): target=target/'index.html'
        if not target.is_relative_to(ROOT):
            errors.append(f'Ruta fuera del repositorio: {page.name}: {link}');continue
        if not target.is_file(): errors.append(f'Falta recurso: {page.relative_to(ROOT)}: {link}');continue
        if parsed.fragment and target.suffix.lower()=='.html':
            if parsed.fragment not in read(target).ids: errors.append(f'Falta ancla {parsed.fragment} en {target.relative_to(ROOT)}')
print('Páginas revisadas:',len(PAGES))
print('Proyectos disponibles:',len(PAGES)-1)
if errors:
    print('\n'.join(errors));sys.exit(1)
print('OK: todos los enlaces internos, anclas y recursos locales resuelven correctamente.')
