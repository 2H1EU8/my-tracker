import Ajv from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import schema from "../../schemas/my-tracker-backup.schema.json";

const ajv = new Ajv({
  allErrors: true,
  strict: false,
});
// @ts-ignore
addFormats(ajv);

export const validateBackup = ajv.compile(schema);
