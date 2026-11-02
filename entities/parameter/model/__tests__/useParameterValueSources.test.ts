/**
 * @jest-environment jsdom
 */
import {renderHook, waitFor} from "@testing-library/react";

const sessions = {
	controller: {
		parameters: {
			a: {id: "a", name: "A", displayname: "A", type: "s"},
			b: {id: "b", name: "B", displayname: "B", type: "s"},
			file: {id: "file", name: "File", displayname: "File", type: "File"},
		},
	},
};

jest.mock("@shapediver/viewer.session", () => ({
	PARAMETER_TYPE: {STRING: "s", FILE: "File"},
}));

jest.mock(
	"@AppBuilderLib/entities/session/model/useShapeDiverStoreSession",
	() => ({
		useShapeDiverStoreSession: (selector: (state: unknown) => unknown) =>
			selector({sessions}),
	}),
);

jest.mock("@AppBuilderLib/shared/lib/logger", () => ({
	Logger: {warn: jest.fn()},
}));

// the type hooks return one value per source they receive, derived from its name
const mapNames = (sources?: {source: {name?: string}}[]) =>
	sources?.map(({source}) => `value:${source.name}`);

jest.mock("../valueSources/useOutputDataSources", () => ({
	useOutputDataSources: ({
		sources,
	}: {
		sources?: {source: {name?: string}}[];
	}) => ({
		outputDataValues: mapNames(sources),
		resetOutputDataValues: () => undefined,
	}),
}));
jest.mock("../valueSources/useScreenshotSources", () => ({
	useScreenshotSources: () => ({
		screenshotValues: undefined,
		resetScreenshotValues: () => undefined,
	}),
}));
jest.mock("../valueSources/useModelStateSources", () => ({
	useModelStateSources: () => ({
		modelStateValues: undefined,
		resetModelStateValues: () => undefined,
	}),
}));
jest.mock("../valueSources/useSdtfSources", () => ({
	useSdtfSources: () => ({
		sdtfValues: undefined,
		resetSdtfValues: () => undefined,
	}),
}));
jest.mock("../valueSources/useExportSources", () => ({
	useExportSources: () => ({
		exportValues: undefined,
		resetExportValues: () => undefined,
	}),
}));

import {useParameterValueSources} from "../useParameterValueSources";

const dataOutput = (name: string) =>
	({type: "dataOutput", props: {name}}) as const;

describe("useParameterValueSources", () => {
	it("returns one result per source", async () => {
		const props = {
			namespace: "controller",
			sources: [
				{source: dataOutput("x"), id: "A"},
				{source: dataOutput("y"), id: "B"},
			],
		};
		const {result} = renderHook(() => useParameterValueSources(props));
		await waitFor(() => expect(result.current).toBeDefined());
		expect(result.current).toEqual(["value:x", "value:y"]);
	});

	it("keeps results aligned when a source is rejected", async () => {
		const props = {
			namespace: "controller",
			sources: [
				{source: dataOutput("x"), id: "A"},
				// rejected: the parameter does not exist
				{source: dataOutput("missing"), id: "Missing"},
				// rejected: a screenshot needs a File parameter
				{
					source: {type: "screenshot", props: {}} as const,
					id: "B",
				},
				{source: dataOutput("y"), id: "B"},
			],
		};
		const {result} = renderHook(() => useParameterValueSources(props));
		await waitFor(() => expect(result.current).toBeDefined());
		expect(result.current).toEqual([
			"value:x",
			undefined,
			undefined,
			"value:y",
		]);
	});
});
