import re

with open("src/features/tracker/TrackerApp.tsx", "r") as f:
    content = f.read()

# Fix import
content = content.replace(
    "PlusIcon,",
    "PlusIcon,\n  UploadSimpleIcon,"
)
content = content.replace(
    "FileArrowUp as FileUpIcon,",
    ""
)

# Fix Dialog usage and replace FileUpIcon with UploadSimpleIcon
new_dialog_code = """
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
  const dialogRef = useRef<HTMLDialogElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      const dialog = dialogRef.current;
      if (dialog && !dialog.open) {
        dialog.showModal();
      }
    } else {
      setFileContent(undefined);
      setFileName(undefined);
      setError(undefined);
      setSuccessSummary(undefined);
      setIsImporting(false);
    }
  }, [isOpen]);

  const close = () => {
    dialogRef.current?.close();
    setIsOpen(false);
    triggerRef.current?.focus();
  };

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
        <UploadSimpleIcon aria-hidden="true" size={20} weight="bold" />
      </button>

      {isOpen ? (
        <dialog
          aria-labelledby="import-plan-title"
          className="entity-dialog"
          onCancel={(event) => {
            if (isImporting) {
              event.preventDefault();
            }
          }}
          onClose={close}
          ref={dialogRef}
        >
          <div className="dialog-header">
            <h2 id="import-plan-title">Import AI Plan</h2>
            <button
              className="icon-button dialog-close"
              disabled={isImporting}
              onClick={close}
              title="Close"
              type="button"
            >
              <XIcon aria-hidden="true" size={20} />
            </button>
          </div>
          <div className="dialog-body">
            {successSummary ? (
              <div className="import-success">
                <p>{successSummary}</p>
                <div className="dialog-actions">
                  <button
                    className="button-primary"
                    onClick={close}
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
                    onClick={close}
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
          </div>
        </dialog>
      ) : null}
    </>
  );
}
"""

# Find old ImportPlanDialog and replace it
start_idx = content.find("interface ImportPlanDialogProps {")
end_idx = content.find("function EntityDialog({", start_idx)

if start_idx != -1 and end_idx != -1:
    content = content[:start_idx] + new_dialog_code + "\n\n" + content[end_idx:]

with open("src/features/tracker/TrackerApp.tsx", "w") as f:
    f.write(content)
