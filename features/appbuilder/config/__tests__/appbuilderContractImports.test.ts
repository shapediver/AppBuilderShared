import {collectDisallowedImports} from "@AppBuilderLib/shared/__tests__/collectDisallowedImports";
import * as path from "node:path";

const CONTRACT_DIR = path.resolve(__dirname, "..");

const CONTRACT_FILES = [
	"appbuilder.ts",
	"appbuildercharts.ts",
	"appbuilderColor.ts",
	"appbuilderagent.ts",
	"appBuilderActionType.ts",
] as const;

function isAllowedExternal(
	specifier: string,
	importedNames: string[],
): boolean {
	if (specifier.startsWith("@shapediver/sdk.")) {
		return true;
	}
	if (specifier === "@shapediver/viewer.shared.types") {
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

describe("appbuilder contract import allowlist", () => {
	it.each(CONTRACT_FILES)(
		"%s only imports allowed packages (recursive)",
		(fileName) => {
			expect(
				collectDisallowedImports(path.join(CONTRACT_DIR, fileName), {
					isAllowedExternal,
				}),
			).toEqual([]);
		},
	);
});
