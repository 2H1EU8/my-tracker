import re

with open('src/features/tracker/TrackerApp.tsx', 'r') as f:
    content = f.read()

# 1. Fix GearIcon
if 'GearIcon' not in content[:500]:
    content = content.replace('XIcon,\n} from "@phosphor-icons/react";', 'XIcon,\n  GearIcon,\n} from "@phosphor-icons/react";')

# 2. Fix item.note mapping in TrackerApp.tsx
content = content.replace('inbox?.items.map((item) => item.note)', 'inbox?.items.filter(item => item.kind === "note").map((item: any) => item.note)')

# 3. Add chrome types reference at the very top
if '/// <reference types="chrome" />' not in content:
    content = '/// <reference types="chrome" />\n' + content

# 4. Fix HomeView missing props in TrackerApp component
home_view_call_pattern = re.compile(r'<HomeView\s+goals=\{snapshot\?.goals\}(.*?)\/>', re.DOTALL)
if home_view_call_pattern.search(content):
    replacement = '<HomeView\n            goals={snapshot?.goals}\\1            onExportBackup={onExportBackup}\n            onRestoreBackup={onRestoreBackup}\n          />'
    content = home_view_call_pattern.sub(replacement, content)

# 5. Fix DialogModal
dialog_modal = """<dialog
          className="entity-dialog"
          onClose={() => setIsOpen(false)}
          ref={(el) => { if (el && isOpen && !el.open) { el.showModal(); } }}
        >
          <div className="dialog-header">
            <h2>Settings and Backup</h2>
            <button className="icon-button dialog-close" onClick={() => setIsOpen(false)}><XIcon size={20}/></button>
          </div>"""
content = content.replace("""<DialogModal
          onClose={() => setIsOpen(false)}
          restoreFocusRef={triggerRef}
          title="Settings and Backup"
        >""", dialog_modal)
content = content.replace("</DialogModal>", "</dialog>")


with open('src/features/tracker/TrackerApp.tsx', 'w') as f:
    f.write(content)
