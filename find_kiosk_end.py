with open(r'src\app\kiosk\page.tsx', 'r', encoding='utf-8', errors='replace') as f:
    lines = f.readlines()
print(f'Total lines: {len(lines)}')
# Find the closing brace of the first component - look for lone '}' after line 50
for i, line in enumerate(lines):
    stripped = line.strip()
    if stripped == '}' and i > 100:
        print(f'Line {i+1}: first lone closing brace')
        print(f'  Prev: {repr(lines[i-1].rstrip())}')
        if i+1 < len(lines):
            print(f'  Next: {repr(lines[i+1].rstrip())}')
        break
