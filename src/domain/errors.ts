export type DomainErrorCode =
  | "invalid_title"
  | "invalid_ai_plan"
  | "invalid_backup"
  | "invalid_note_body"
  | "invalid_note_link"
  | "invalid_status"
  | "not_found"
  | "parent_mismatch"
  | "invalid_reorder_target";

export class DomainError extends Error {
  constructor(
    public readonly code: DomainErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "DomainError";
  }
}
