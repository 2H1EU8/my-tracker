import type {
  StoreName,
  TrackerDatabase,
  TrackerRepositories,
  TransactionMode,
} from "../../application/ports";

export interface QaFaultOptions {
  delayFirstReadMs?: number;
  failFirstRead?: boolean;
  failNextWrite?: boolean;
}

export class QaFaultDatabase implements TrackerDatabase {
  private isFirstRead = true;
  private shouldFailFirstRead: boolean;
  private shouldFailNextWrite: boolean;

  constructor(
    private readonly database: TrackerDatabase,
    private readonly options: QaFaultOptions,
  ) {
    this.shouldFailFirstRead = options.failFirstRead ?? false;
    this.shouldFailNextWrite = options.failNextWrite ?? false;
  }

  async transaction<T>(
    stores: readonly StoreName[],
    mode: TransactionMode,
    operation: (repositories: TrackerRepositories) => Promise<T>,
  ): Promise<T> {
    if (mode === "readonly" && this.isFirstRead) {
      this.isFirstRead = false;
      const delay = Math.max(0, Math.min(this.options.delayFirstReadMs ?? 0, 5000));
      if (delay > 0) {
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
      if (this.shouldFailFirstRead) {
        this.shouldFailFirstRead = false;
        throw new Error("Simulated initial load failure for QA.");
      }
    }

    if (mode === "readwrite" && this.shouldFailNextWrite) {
      this.shouldFailNextWrite = false;
      throw new Error("Simulated save failure for QA.");
    }

    return this.database.transaction(stores, mode, operation);
  }
}
