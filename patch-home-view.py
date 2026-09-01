with open("src/features/tracker/TrackerApp.tsx", "r") as f:
    content = f.read()

# Add onImportPlan prop to HomeView
home_view_props = "  onRetryInbox: () => Promise<void>;\n  onImportPlan: (plan: unknown) => Promise<{ goalsImported: number; phasesImported: number; tasksImported: number; checklistItemsImported: number }>;\n}"
content = content.replace("  onRetryInbox: () => Promise<void>;\n}", home_view_props)

home_view_args = "  onRetryGoals,\n  onRetryInbox,\n  onImportPlan,\n}: HomeViewProps) {"
content = content.replace("  onRetryGoals,\n  onRetryInbox,\n}: HomeViewProps) {", home_view_args)

# Now define onImportPlan in TrackerApp
on_import_plan_def = """
  const onImportPlan = async (parsedPlan: unknown) => {
    let summary: any;
    await performMutation(
      async () => {
        summary = await service.importAiPlan(parsedPlan);
      },
      "Plan imported successfully.",
      () => undefined,
      "local",
      () => loadWorkspace()
    );
    return summary;
  };
"""
# insert before onCreateGoal in TrackerApp
content = content.replace(
    "            onCreateGoal={async (title) => {",
    on_import_plan_def + "\n            onImportPlan={onImportPlan}\n            onCreateGoal={async (title) => {"
)

with open("src/features/tracker/TrackerApp.tsx", "w") as f:
    f.write(content)
