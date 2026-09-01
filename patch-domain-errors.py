with open("src/domain/errors.ts", "r") as f:
    content = f.read()

content = content.replace('"invalid_title"', '"invalid_title"\n  | "invalid_ai_plan"')

with open("src/domain/errors.ts", "w") as f:
    f.write(content)
