import type {
  StoreName,
  TrackerDatabase,
  TrackerRepositories,
  TransactionMode,
} from "../../application/ports";

export class FailNextWriteDatabase implements TrackerDatabase {
  private shouldFail = true;

  constructor(private readonly database: TrackerDatabase) {}

  transaction<T>(
    stores: readonly StoreName[],
    mode: TransactionMode,
    operation: (repositories: TrackerRepositories) => Promise<T>,
  ): Promise<T> {
    if (mode === "readwrite" && this.shouldFail) {
      this.shouldFail = false;
      return Promise.reject(new Error("Simulated save failure for QA."));
    }

    return this.database.transaction(stores, mode, operation);
  }
}
