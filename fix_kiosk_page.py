with open(r'src\app\kiosk\page.tsx', 'r', encoding='utf-8', errors='replace') as f:
    lines = f.readlines()

print(f'Total lines: {len(lines)}')

# Find the } that closes the first component
# Look for a lone } followed by orphaned JSX (the comment line)
cut_at = None
for i in range(50, len(lines)):
    if lines[i].strip() == '}':
        # Check if next non-blank line is orphaned JSX (starts with spaces + {)
        for j in range(i+1, min(i+5, len(lines))):
            if lines[j].strip():
                # Is it JSX outside a component?
                if lines[j].strip().startswith('{/*') or lines[j].strip().startswith('<'):
                    cut_at = i + 1  # keep up to and including line i (the })
                    print(f'First component ends at line {i+1}, orphan starts at line {j+1}')
                    print(f'  Closing line: {repr(lines[i].rstrip())}')
                    print(f'  First orphan: {repr(lines[j].rstrip())}')
                break
        if cut_at:
            break

if cut_at:
    kept = lines[:cut_at]
    # Remove trailing blank lines, keep just one newline at end
    while kept and kept[-1].strip() == '':
        kept.pop()
    kept.append('\n')
    
    with open(r'src\app\kiosk\page.tsx', 'w', encoding='utf-8') as f:
        f.writelines(kept)
    print(f'File truncated from {len(lines)} to {len(kept)} lines')
else:
    print('No orphaned block found - file may be clean already')
