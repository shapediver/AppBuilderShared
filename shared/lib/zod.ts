import {z} from "zod";
import {prettifyError} from "zod/v4";

// Zod's default JIT/eval capability probe uses new Function(""), which is
// reported as a CSP violation in strict environments without 'unsafe-eval'.
// Configure Zod before any app schemas are created or parsed.
z.config({jitless: true});

export type {RefinementCtx} from "zod";
export {prettifyError, z};
export default z;
