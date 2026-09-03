import {IN_SCOPE_GENERIC_TOOL_NAMES} from "@AppBuilderLib/features/agent-tools/config/inScopeGenericTools";
import {INPUT_SCHEMA_BY_TOOL} from "@AppBuilderLib/features/agent-tools/config/schemaFor";
import {AGENT_TOOL_META} from "@AppBuilderLib/features/agent-tools/config/toolMeta";
import {zodToJsonSchema} from "@AppBuilderLib/features/agent-tools/lib/zodToJsonSchema";

describe("INPUT_SCHEMA_BY_TOOL", () => {
	it("has a schema for every in-scope generic tool", () => {
		expect(Object.keys(INPUT_SCHEMA_BY_TOOL).sort()).toEqual(
			[...IN_SCOPE_GENERIC_TOOL_NAMES].sort(),
		);
		for (const name of IN_SCOPE_GENERIC_TOOL_NAMES) {
			expect(INPUT_SCHEMA_BY_TOOL[name]).toBeDefined();
		}
	});

	it("converts each schema to a JSON Schema object type", () => {
		for (const name of IN_SCOPE_GENERIC_TOOL_NAMES) {
			const jsonSchema = zodToJsonSchema(INPUT_SCHEMA_BY_TOOL[name]);
			expect(jsonSchema.type).toBe("object");
		}
	});
});

describe("AGENT_TOOL_META", () => {
	it("has meta for every in-scope generic tool", () => {
		expect(Object.keys(AGENT_TOOL_META).sort()).toEqual(
			[...IN_SCOPE_GENERIC_TOOL_NAMES].sort(),
		);
		for (const name of IN_SCOPE_GENERIC_TOOL_NAMES) {
			expect(AGENT_TOOL_META[name]).toBeDefined();
		}
	});
});
