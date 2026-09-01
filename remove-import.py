import sys

with open('entrypoints/background.ts', 'r') as f:
    bg = f.read()

bg = bg.replace('import { defineBackground } from "wxt/sandbox";\n', '')

with open('entrypoints/background.ts', 'w') as f:
    f.write(bg)

