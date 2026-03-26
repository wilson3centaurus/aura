import re

with open(r'src\app\admin\wards\page.tsx', 'rb') as f:
    raw = f.read()

# Find icon positions
for m in re.finditer(b"icon: '", raw):
    s = m.end()
    snippet = raw[s:s+12]
    print(f'pos {s}: {snippet.hex()} | {repr(snippet)}')

print()
# Find all corrupt positions (FFFD or control chars in UTF-8 decode)
text = raw.decode('utf-8', errors='replace')
positions = [(i, c) for i, c in enumerate(text) if ord(c) == 0xFFFD or (ord(c) < 32 and c not in '\n\t\r')]
for pos, c in positions:
    ctx = text[max(0,pos-40):pos+40]
    print(f'pos {pos} U+{ord(c):04X}: ...{repr(ctx)}...')
    print()
