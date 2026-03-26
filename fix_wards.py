"""Fix emoji corruption in admin/wards/page.tsx"""

with open(r'src\app\admin\wards\page.tsx', 'r', encoding='utf-8', errors='replace') as f:
    content = f.read()

# Remove BOM artifact at start
if content.startswith('\uFFFD'):
    content = content[1:]
    print('Removed BOM artifact')

# Fix specific patterns using context-sensitive replacements
replacements = [
    # Ward count separator: "wards · {totalBeds}"
    ('wards \uFFFD {totalBeds}', 'wards · {totalBeds}'),
    # Total Beds icon (=🛏\x0f)
    ("icon: '=\uFFFD\x0f',", "icon: '🛏️',"),
    # Occupied icon (=4 — red circle)
    ("icon: '=4',", "icon: '🔴',"),
    # Available icon (=✅)
    ("icon: '=\uFFFD', color: 'text-emerald-600", "icon: '✅', color: 'text-emerald-600"),
    # Occupancy icon (=📊)
    ("icon: '=\uFFFD', color: occupancyPct", "icon: '📊', color: occupancyPct"),
    # Legend hover hint
    ('text-gray-400">\uFFFD Hover over', 'text-gray-400">• Hover over'),
    # Empty state: select a ward
    ('"text-5xl block mb-3"><\uFFFD<', '"text-5xl block mb-3">🛏️<'),
    # Nurse separator in ward info header
    ('nurse_in_charge && <> \uFFFD Nurse:', 'nurse_in_charge && <> · Nurse:'),
    # Coordinates prefix in ward detail
    ('mt-0.5">\n                      =\uFFFD {selectedWard.', 'mt-0.5">\n                      📍 {selectedWard.'),
    # Empty state inside bed grid (=🛏\x0f)
    ('"text-5xl mb-3">=\uFFFD\x0f<', '"text-5xl mb-3">🛏️<'),
    # Coordinates prefix in create form
    ('normal-case">=\uFFFD {form.latitude}', 'normal-case">📍 {form.latitude}'),
]

for old, new in replacements:
    count = content.count(old)
    if count:
        content = content.replace(old, new)
        print(f'Fixed: {repr(old[:40])} ({count}x)')
    else:
        print(f'NOT FOUND: {repr(old[:40])}')

with open(r'src\app\admin\wards\page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

# Verify
with open(r'src\app\admin\wards\page.tsx', 'r', encoding='utf-8', errors='replace') as f:
    check = f.read()

remaining = [(i, c) for i, c in enumerate(check) if ord(c) == 0xFFFD or (ord(c) < 32 and c not in '\n\t\r')]
print(f'\nRemaining issues: {len(remaining)}')
for pos, c in remaining[:10]:
    print(f'  pos {pos}: U+{ord(c):04X} ctx={repr(check[max(0,pos-20):pos+20])}')
