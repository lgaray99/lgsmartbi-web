"""Revisión heurística de archivos nuevos/modificados; nunca imprime posibles secretos."""
import ipaddress
import re
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def git_paths(*args):
    result = subprocess.run(['git', *args, '-z'], cwd=ROOT, check=True, capture_output=True)
    return set(result.stdout.decode('utf-8').split('\0')) - {''}


paths = sorted(git_paths('diff', '--name-only', 'HEAD') | git_paths('ls-files', '--others', '--exclude-standard'))
patterns = {
    'formato de credencial': re.compile(r'(?:gh[pousr]_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,}|sk-[A-Za-z0-9]{20,}|AKIA[0-9A-Z]{16})'),
    'credencial literal': re.compile(r'''(?i)(?:password|passwd|api[_-]?key|secret)\s*[:=]\s*['"][^'"\n]{6,}['"]'''),
    'ruta privada': re.compile(r'(?i)(?:[A-Z]:[\\/](?:Users|Clientes)[\\/]|\\\\[A-Za-z0-9_.-]+\\[A-Za-z0-9_$.-]+)'),
}
forbidden = {'.pbix', '.pbit', '.accdb', '.mdb', '.dump', '.sqlite', '.db', '.pem', '.key'}
findings = []
for relative in paths:
    path = ROOT / relative
    if not path.is_file():
        continue
    if path.suffix.lower() in forbidden or path.name.startswith('.env'):
        findings.append((relative, 0, 'formato no publicable'))
        continue
    try:
        text = path.read_text(encoding='utf-8-sig')
    except UnicodeDecodeError:
        findings.append((relative, 0, 'binario requiere revisión manual'))
        continue
    for number, line in enumerate(text.splitlines(), 1):
        for name, pattern in patterns.items():
            if pattern.search(line):
                findings.append((relative, number, name))
        for match in re.findall(r'\b(?:\d{1,3}\.){3}\d{1,3}\b', line):
            try:
                address = ipaddress.ip_address(match)
            except ValueError:
                continue
            if address.is_private and not address.is_loopback:
                findings.append((relative, number, 'IP privada'))

print(f'Archivos nuevos/modificados revisados: {len(paths)}; hallazgos: {len(findings)}')
for relative, number, rule in findings:
    print(f'{relative}:{number}: {rule}')
if findings:
    raise SystemExit(1)
print('Sin patrones de credenciales, rutas privadas, IP internas o formatos prohibidos. Revisión heurística, complementada con inspección del diff.')
