/**
 * @jest-environment jsdom
 */
import {act, renderHook, waitFor} from "@testing-library/react";

const uploadSDTF = jest.fn(async () => [{id: "asset-1"}]);
const createProcessManager = jest.fn(() => "pm");
const addProcess = jest.fn();

const sessions = {
	session: {
		uploadSDTF,
	},
};

const output = {
	content: [{href: "https://example.test/out.sdtf"}],
};
const outputs = [output, output];

jest.mock("@AppBuilderLib/entities/output/model/useOutputs", () => ({
	useOutputs: () => outputs,
}));

jest.mock(
	"@AppBuilderLib/entities/session/model/useShapeDiverStoreSession",
	() => ({
		useShapeDiverStoreSession: (selector: (state: unknown) => unknown) =>
			selector({sessions}),
	}),
);

jest.mock(
	"@AppBuilderLib/shared/model/useShapeDiverStoreProcessManager",
	() => ({
		useShapeDiverStoreProcessManager: (
			selector: (state: unknown) => unknown,
		) =>
			selector({
				createProcessManager,
				addProcess,
			}),
	}),
);

jest.mock("@AppBuilderLib/shared/lib/logger", () => ({
	Logger: {warn: jest.fn()},
}));

import {useSdtfSources} from "../useSdtfSources";

describe("useSdtfSources", () => {
	const originalFetch = globalThis.fetch;
	const sources = [
		{
			source: {
				name: "Result",
				chunk: {name: "Mesh"},
			},
			namespace: "session",
		},
		{
			source: {
				name: "Result",
				chunk: {name: "Surfaces"},
			},
			namespace: "session",
		},
	];

	beforeEach(() => {
		uploadSDTF.mockClear();
		createProcessManager.mockClear();
		addProcess.mockClear();
		globalThis.fetch = jest.fn(async () => ({
			arrayBuffer: async () => new ArrayBuffer(4),
		})) as unknown as typeof fetch;
	});

	afterEach(() => {
		globalThis.fetch = originalFetch;
	});

	it("uploads one sdTF when two sources select different chunks", async () => {
		const {result, unmount} = renderHook(() =>
			useSdtfSources({
				namespace: "session",
				sources,
			}),
		);

		await waitFor(() => expect(result.current.sdtfValues).toBeDefined());

		expect(globalThis.fetch).toHaveBeenCalledTimes(1);
		expect(uploadSDTF).toHaveBeenCalledTimes(1);
		expect(addProcess).toHaveBeenCalledTimes(1);
		expect(result.current.sdtfValues).toEqual([
			JSON.stringify(
				{asset: {id: "asset-1", chunk: {name: "Mesh"}}},
				null,
				2,
			),
			JSON.stringify(
				{asset: {id: "asset-1", chunk: {name: "Surfaces"}}},
				null,
				2,
			),
		]);

		act(() => {
			result.current.resetSdtfValues();
		});
		expect(result.current.sdtfValues).toBeUndefined();
		unmount();
	});
});
