"""Fix emoji encoding corruption in admin/doctors/page.tsx
The file has doubly-encoded emoji (UTF-8 bytes read as cp1252, then those chars written as UTF-8).
"""

with open(r'src\app\admin\doctors\page.tsx', 'r', encoding='utf-8', errors='replace') as f:
    content = f.read()

# Remove leading FFFD (BOM artifact)
if content.startswith('\uFFFD'):
    content = content[1:]

# Mapping of doubly-encoded sequences to correct emoji
replacements = [
    # ✅ (U+2705): E2 9C 85 → â, œ, …
    ('\u00e2\u0153\u2026', '\u2705'),  # âœ…  → ✅
    # ⚠️ (U+26A0 U+FE0F): E2 9A A0 EF B8 8F → â š \xa0 ï ¸ \x8f
    ('\u00e2\u0161\u00a0\u00ef\u00b8\x8f', '\u26a0\ufe0f'),  # âš ï¸ → ⚠️
    # 🟢 (U+1F7E2): F0 9F 9F A2 → ð Ÿ Ÿ ¢
    ('\u00f0\u0178\u0178\u00a2', '\U0001F7E2'),  # ðŸŸ¢ → 🟢
    # 🟡 (U+1F7E1): F0 9F 9F A1 → ð Ÿ Ÿ ¡
    ('\u00f0\u0178\u0178\u00a1', '\U0001F7E1'),  # ðŸŸ¡ → 🟡
    # 🔵 (U+1F535): F0 9F 94 B5 → ð Ÿ " µ
    ('\u00f0\u0178\u201c\u00b5', '\U0001F535'),  # ðŸ"µ → 🔵
    # ⚫ (U+26AB): E2 9A AB → â š «
    ('\u00e2\u0161\u00ab', '\u26ab'),  # âš« → ⚫
    # — (em dash U+2014): E2 80 94 → â € "
    ('\u00e2\u20ac\u201c', '\u2014'),  # â€" → —
    # 👨‍⚕️ (U+1F468 U+200D U+2695 U+FE0F): complex
    # F0 9F 91 A8 E2 80 8D E2 9A 95 EF B8 8F
    # → ð Ÿ \u2018 ¨ â € \x8d â š • ï ¸ \x8f
    ('\u00f0\u0178\u2018\u00a8\u00e2\u20ac\x8d\u00e2\u0161\u2022\u00ef\u00b8\x8f',
     '\U0001F468\u200d\u2695\ufe0f'),
]

for old, new in replacements:
    content = content.replace(old, new)

with open(r'src\app\admin\doctors\page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print('Doctors page: emoji fixed')

# Verify
with open(r'src\app\admin\doctors\page.tsx', 'r', encoding='utf-8', errors='replace') as f:
    check = f.read()

# Check for Latin-1 style corruption (chars in U+0080-U+00FF that shouldn't be there)
# These would appear as sequences like ð, â, œ, Ÿ used as emoji encoding
import re
bad = re.findall(r'[\u00e2\u00ef][\u0100-\u9FFF\x80-\xFF]', check)
ctrl = [(i, repr(c)) for i, c in enumerate(check) if ord(c) < 32 and c not in '\n\t\r']
if ctrl:
    print(f'Control chars remain: {ctrl[:5]}')
else:
    print('No control chars ✅')
print(f'Potential double-encoded sequences remaining: {len(bad)}')
if bad:
    print(f'  Examples: {bad[:5]}')
