import {
	APPBUILDER_SHARED_ROOT,
	collectDisallowedImports,
} from "@AppBuilderLib/shared/__tests__/collectDisallowedImports";
import * as path from "node:path";

const CLIENT_FILES = [
	"features/agent-tools/api/toolsApi.ts",
	"features/agent-tools/config/toolsApi.ts",
] as const;

function isAllowedExternal(specifier: string): boolean {
	if (specifier === "post-robot") {
		return true;
	}
	if (
		specifier === "@AppBuilderLib/shared/lib/zod" ||
		specifier === "@AppBuilderShared/shared/lib/zod"
	) {
		return true;
	}
	return false;
}

describe("ToolsApi client import allowlist", () => {
	it.each(CLIENT_FILES)(
		"%s only imports zod and post-robot (recursive)",
		(relativePath) => {
			expect(
				collectDisallowedImports(
					path.join(APPBUILDER_SHARED_ROOT, relativePath),
					{isAllowedExternal},
				),
			).toEqual([]);
		},
	);
});
