import re

with open("src/features/tracker/TrackerApp.tsx", "r") as f:
    content = f.read()

# Add FileUp icon to imports
if "FileArrowUp as FileUpIcon" not in content:
    content = content.replace(
        "Plus as PlusIcon,",
        "Plus as PlusIcon,\n  FileArrowUp as FileUpIcon,"
    )

dialog_code = """
interface ImportPlanDialogProps {
  onImport: (content: string) => Promise<{ goalsImported: number; phasesImported: number; tasksImported: number; checklistItemsImported: number }>;
}

function ImportPlanDialog({ onImport }: ImportPlanDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [fileContent, setFileContent] = useState<string>();
  const [fileName, setFileName] = useState<string>();
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState<string>();
  const [successSummary, setSuccessSummary] = useState<string>();
  
  const triggerRef = useRef<HTMLButtonElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) {
      setFileContent(undefined);
      setFileName(undefined);
      setError(undefined);
      setSuccessSummary(undefined);
      setIsImporting(false);
    }
  }, [isOpen]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError("File is too large. Maximum size is 5MB.");
      return;
    }

    setFileName(file.name);
    setError(undefined);
    setSuccessSummary(undefined);

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result;
      if (typeof result === "string") {
        setFileContent(result);
      } else {
        setError("Failed to read file.");
      }
    };
    reader.onerror = () => {
      setError("Failed to read file.");
    };
    reader.readAsText(file);
  };

  const confirmImport = async () => {
    if (!fileContent) return;
    setIsImporting(true);
    setError(undefined);
    try {
      const parsed = JSON.parse(fileContent);
      const summary = await onImport(parsed);
      setSuccessSummary(`Imported ${summary.goalsImported} goals, ${summary.phasesImported} phases, ${summary.tasksImported} tasks, and ${summary.checklistItemsImported} checklist items.`);
    } catch (err: any) {
      setError(err instanceof Error ? err.message : "An unknown error occurred during import.");
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <>
      <button
        aria-label="Import AI Plan"
        className="icon-button"
        onClick={() => setIsOpen(true)}
        ref={triggerRef}
        title="Import AI Plan"
        type="button"
      >
        <FileUpIcon aria-hidden="true" size={20} weight="bold" />
      </button>

      {isOpen && (
        <DialogModal
          onClose={() => setIsOpen(false)}
          restoreFocusRef={triggerRef}
          title="Import AI Plan"
        >
          {successSummary ? (
            <div className="import-success">
              <p>{successSummary}</p>
              <div className="dialog-actions">
                <button
                  className="button-primary"
                  onClick={() => setIsOpen(false)}
                  type="button"
                >
                  Close
                </button>
              </div>
            </div>
          ) : (
            <div className="import-plan-content">
              <p>Select a JSON AI Plan file to import.</p>
              <input
                accept="application/json,.json"
                className="file-input"
                disabled={isImporting}
                onChange={handleFileChange}
                ref={fileInputRef}
                type="file"
                style={{ margin: "16px 0" }}
              />

              {fileContent && !error && (
                <div className="import-preview" style={{ background: "var(--background-raised)", padding: "12px", borderRadius: "8px", margin: "16px 0" }}>
                  <p><strong>File:</strong> {fileName}</p>
                  <p>Preview ready. The plan will be added to your current goals.</p>
                </div>
              )}

              {error && (
                <div className="error-banner" style={{ margin: "16px 0" }}>
                  <p>{error}</p>
                </div>
              )}

              <div className="dialog-actions">
                <button
                  disabled={isImporting}
                  onClick={() => setIsOpen(false)}
                  type="button"
                >
                  Cancel
                </button>
                <button
                  className="button-primary"
                  disabled={isImporting || !fileContent || !!error}
                  onClick={() => void confirmImport()}
                  type="button"
                >
                  {isImporting ? "Importing..." : "Confirm Import"}
                </button>
              </div>
            </div>
          )}
        </DialogModal>
      )}
    </>
  );
}
"""

if "ImportPlanDialog" not in content:
    content = content.replace(
        "function EntityDialog({",
        dialog_code + "\n\nfunction EntityDialog({"
    )

handler_code = """
  const onImportPlan = async (parsedPlan: unknown) => {
    setSaveState("saving");
    try {
      const summary = await service.importAiPlan(parsedPlan);
      await loadWorkspace();
      setSaveState("saved");
      setRetryOperation(undefined);
      return summary;
    } catch (error) {
      setSaveState("failed");
      setRetryOperation(undefined);
      throw error;
    }
  };
"""

if "onImportPlan" not in content:
    content = content.replace(
        "const onCreateGoal = async (title: string) => {",
        handler_code + "\n  const onCreateGoal = async (title: string) => {"
    )

pattern = r'(<EntityDialog\s+dialogTitle="Create goal"[\s\S]*?triggerLabel="Create goal"\s+/>)'
replacement = r'<div style={{ display: "flex", gap: "8px" }}>\n            <ImportPlanDialog onImport={onImportPlan} />\n            \1\n          </div>'
if "ImportPlanDialog onImport={onImportPlan}" not in content:
    content = re.sub(pattern, replacement, content, count=1)


with open("src/features/tracker/TrackerApp.tsx", "w") as f:
    f.write(content)

