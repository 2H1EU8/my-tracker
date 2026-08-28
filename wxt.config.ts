import { defineConfig } from "wxt";

export default defineConfig({
  modules: ["@wxt-dev/module-react"],
  manifest: {
    name: "My Tracker",
    description: "A calm, local-first New Tab for personal project planning.",
    permissions: [],
    host_permissions: [],
  },
});
