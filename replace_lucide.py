import os
import re

directories_to_scan = [
    r"c:\Users\asus\DotivoApp\GoalTracker-FE\src"
]

def map_icon_names(match):
    icons_str = match.group(1)
    # e.g., "\n  Check, ArrowRight, SkipForward\n"
    # split by comma, strip whitespace, map
    parts = []
    for p in icons_str.split(','):
        p = p.strip()
        if not p:
            continue
        if ' as ' in p:
            parts.append(p)
            continue
        if p == 'Image':
            parts.append('ImageIcon')
        elif p == 'Eye':
            parts.append('OpenEyeIcon as Eye')
        elif p == 'EyeOff':
            parts.append('CloseEyeIcon as EyeOff')
        else:
            parts.append(f"{p}Icon as {p}")
            
    # Calculate depth to src/svg
    return f"import {{ {', '.join(parts)} }} from '@/src/svg';"

def calculate_relative_path(file_path):
    # This is a bit tricky, let's just use absolute path aliasing if supported,
    # or calculate relative path
    parts = file_path.split('\\src\\')
    if len(parts) > 1:
        depth = parts[1].count('\\')
        if depth == 0:
            return './svg'
        else:
            return '../' * depth + 'svg'
    return 'src/svg'

def replace_in_file(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Find the import
    pattern = re.compile(r"import\s+\{([^}]+)\}\s+from\s+['\"]lucide-react-native['\"];?")
    match = pattern.search(content)
    if not match:
        return

    rel_path = calculate_relative_path(file_path)
    
    def replacer(m):
        icons_str = m.group(1)
        parts = []
        for p in icons_str.split(','):
            p = p.strip()
            if not p:
                continue
            if ' as ' in p:
                parts.append(p) # already mapped in some cases
                continue
            if p == 'Image':
                parts.append('ImageIcon')
            elif p == 'Eye':
                parts.append('OpenEyeIcon as Eye')
            elif p == 'EyeOff':
                parts.append('CloseEyeIcon as EyeOff')
            else:
                parts.append(f"{p}Icon as {p}")
        return f"import {{ {', '.join(parts)} }} from '{rel_path}';"

    new_content = pattern.sub(replacer, content)

    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print(f"Updated {file_path}")

for root, _, files in os.walk(directories_to_scan[0]):
    for file in files:
        if file.endswith('.tsx') or file.endswith('.ts'):
            replace_in_file(os.path.join(root, file))
