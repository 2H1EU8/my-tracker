import Ajv from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import schema from "../../schemas/my-tracker-ai-plan.schema.json";

const ajv = new Ajv({
  allErrors: true,
  strict: true,
});
// @ts-ignore
addFormats(ajv);

export const validateAiPlan = ajv.compile(schema);
