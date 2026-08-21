import fs from "fs";
import path from "path";

const CONFIG_DIR = path.resolve(__dirname, "..");

const FORBIDDEN_PREFIXES = ["@shapediver/", "@mantine/"];
const FORBIDDEN_EXACT = [
	"@AppBuilderLib/features/appbuilder/config/appbuilder",
	"@AppBuilderLib/features/appbuilder/config/appbuilderagent",
];

function configTsFiles(): string[] {
	return fs
		.readdirSync(CONFIG_DIR)
		.filter((name) => name.endsWith(".ts"))
		.map((name) => path.join(CONFIG_DIR, name));
}

function importedSpecifiers(source: string): string[] {
	const specs: string[] = [];
	const fromRe = /\bfrom\s+["']([^"']+)["']/g;
	const sideEffectRe = /^\s*import\s+["']([^"']+)["']/gm;
	const dynamicRe = /\bimport\s*\(\s*["']([^"']+)["']\s*\)/g;
	for (const re of [fromRe, sideEffectRe, dynamicRe]) {
		let match: RegExpExecArray | null;
		while ((match = re.exec(source)) !== null) {
			specs.push(match[1]);
		}
	}
	return specs;
}

function isForbiddenSpecifier(spec: string): boolean {
	if (FORBIDDEN_PREFIXES.some((prefix) => spec.startsWith(prefix))) {
		return true;
	}
	if (FORBIDDEN_EXACT.includes(spec)) {
		return true;
	}
	const base = spec.split("/").pop();
	return base === "appbuilder" || base === "appbuilderagent";
}

describe("agent-tools config import isolation", () => {
	it("does not import shapediver, mantine, appbuilder, or appbuilderagent", () => {
		const violations: string[] = [];
		for (const filePath of configTsFiles()) {
			const source = fs.readFileSync(filePath, "utf8");
			for (const spec of importedSpecifiers(source)) {
				if (isForbiddenSpecifier(spec)) {
					violations.push(`${path.basename(filePath)}: ${spec}`);
				}
			}
		}
		expect(violations).toEqual([]);
	});

	it("listParameterDefinitions does not contain ResParameterType", () => {
		const source = fs.readFileSync(
			path.join(CONFIG_DIR, "listParameterDefinitions.ts"),
			"utf8",
		);
		expect(source).not.toContain("ResParameterType");
	});
});
