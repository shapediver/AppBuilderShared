import {
	APPBUILDER_SHARED_ROOT,
	collectDisallowedImports,
} from "@AppBuilderLib/shared/__tests__/collectDisallowedImports";
import * as path from "node:path";

const MARKDOWN_FILE = path.join(
	APPBUILDER_SHARED_ROOT,
	"shared/ui/markdown/Markdown.tsx",
);

const ALLOWED_EXTERNALS = new Set([
	"react",
	"react-markdown",
	"react-markdown/lib",
	"remark-directive",
	"remark-gfm",
	"unist-util-visit",
	"@mantine/core",
]);

function isAllowedExternal(specifier: string): boolean {
	return ALLOWED_EXTERNALS.has(specifier);
}

describe("Markdown import graph", () => {
	it("only imports parser packages, @mantine/core, and CSS", () => {
		expect(
			collectDisallowedImports(MARKDOWN_FILE, {isAllowedExternal}),
		).toEqual([]);
	});
});
