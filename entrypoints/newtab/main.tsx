import React from "react";
import ReactDOM from "react-dom/client";
import { TrackerService } from "../../src/application/tracker-service";
import { TrackerApp } from "../../src/features/tracker/TrackerApp";
import { IndexedDbTrackerDatabase } from "../../src/infrastructure/db/indexeddb-tracker-database";
import { QaFaultDatabase } from "../../src/infrastructure/db/qa-fault-database";
import "./style.css";

const indexedDbDatabase = new IndexedDbTrackerDatabase(indexedDB);
const query = new URLSearchParams(window.location.search);
const delayFirstReadMs = Number.parseInt(query.get("qaDelayLoadMs") ?? "0", 10);
const database = new QaFaultDatabase(indexedDbDatabase, {
  delayFirstReadMs: Number.isFinite(delayFirstReadMs) ? delayFirstReadMs : 0,
  failFirstRead: query.has("qaFailLoadOnce"),
  failNextWrite: query.has("qaFailNextWrite"),
});
const service = new TrackerService(database, {
  clock: () => new Date().toISOString(),
  createId: () => crypto.randomUUID(),
});
const root = document.querySelector<HTMLDivElement>("#root");

if (root === null) {
  throw new Error("My Tracker root element is missing.");
}

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <TrackerApp service={service} />
  </React.StrictMode>,
);
