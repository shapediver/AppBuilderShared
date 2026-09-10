import {
	APPBUILDER_SHARED_ROOT,
	collectDisallowedImports,
} from "@AppBuilderLib/shared/__tests__/collectDisallowedImports";
import * as path from "node:path";

const CLIENT_FILES = [
	"features/ecommerce/api/ecommerceapi.ts",
	"features/ecommerce/config/ecommerceapi.ts",
	"features/ecommerce/config/ecommerceapitypecheck.ts",
	"features/ecommerce/config/scrollingapi.ts",
] as const;

function isAllowedExternal(specifier: string): boolean {
	if (specifier === "post-robot") {
		return true;
	}
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

describe("ECommerce API client import allowlist", () => {
	it.each(CLIENT_FILES)(
		"%s only imports zod, post-robot, and ShapeDiver SDKs (recursive)",
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
