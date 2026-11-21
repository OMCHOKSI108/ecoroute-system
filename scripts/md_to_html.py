import sys
import markdown

if len(sys.argv) < 2:
    print("Usage: python3 md_to_html.py <input.md>")
    sys.exit(1)

with open(sys.argv[1], 'r', encoding='utf-8') as f:
    text = f.read()

# Preprocess github alerts/callouts
lines = []
for line in text.split('\n'):
    if line.startswith('> [!NOTE]') or line.startswith('> [!TIP]'):
        lines.append('<div class="callout callout-info">' + line.replace('> [!NOTE]', '<strong>NOTE:</strong>').replace('> [!TIP]', '<strong>TIP:</strong>'))
    elif line.startswith('> [!WARNING]') or line.startswith('> [!CAUTION]'):
        lines.append('<div class="callout callout-warning">' + line.replace('> [!WARNING]', '<strong>WARNING:</strong>').replace('> [!CAUTION]', '<strong>CAUTION:</strong>'))
    elif line.startswith('> [!IMPORTANT]'):
        lines.append('<div class="callout callout-danger">' + line.replace('> [!IMPORTANT]', '<strong>IMPORTANT:</strong>'))
    else:
        lines.append(line)
text = '\n'.join(lines)

html = markdown.markdown(text, extensions=['tables', 'fenced_code', 'nl2br'])
sys.stdout.write(html)
