import {PARAMETER_TYPE} from "@shapediver/viewer.session";
import {resolveParameterExportValue} from "./resolveParameterExportValue";

describe("resolveParameterExportValue", () => {
	it("returns stringExecValue for FILE parameters", () => {
		const result = resolveParameterExportValue({
			definitionType: PARAMETER_TYPE.FILE,
			execValue: {},
			stringExecValue: () => "uploaded-file-uuid-123",
		});
		expect(result).toBe("uploaded-file-uuid-123");
	});

	it("returns execValue for non-FILE parameters", () => {
		const result = resolveParameterExportValue({
			definitionType: PARAMETER_TYPE.FLOAT,
			execValue: 3.14,
			stringExecValue: () => "3.14",
		});
		expect(result).toBe(3.14);
	});
});
