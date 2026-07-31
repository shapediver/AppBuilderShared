/**
 * @jest-environment jsdom
 */
import {renderHook, waitFor} from "@testing-library/react";
import * as React from "react";

const savedStateFixture = {
	id: "ss-1",
	name: "SS-01",
	parameters: {width: "2", height: "7"},
};

// Mock the platform environment helpers.
jest.mock("@AppBuilderLib/shared/lib/platform/environment", () => ({
	shouldUsePlatform: jest.fn(() => false),
	getDefaultPlatformUrl: jest.fn(() => "https://platform.test"),
	getPlatformClientId: jest.fn(() => "client-id"),
}));

// Mock the SDK creator so the off-platform path does not perform network calls.
const iframeEmbeddingMock = jest.fn();
jest.mock("@shapediver/sdk.platform-api-sdk-v1", () => ({
	create: () => ({
		models: {iframeEmbedding: iframeEmbeddingMock},
	}),
}));

// Mock the saved-states store.
const useQueryMock = jest.fn();
const addItemMock = jest.fn();
jest.mock("../useShapeDiverStorePlatformSavedStates", () => ({
	useShapeDiverStorePlatformSavedStates: () => ({
		useQuery: useQueryMock,
		addItem: addItemMock,
		items: {},
	}),
}));

import useQuerySavedState from "../useQuerySavedState";

function setupUseQuery(items: string[] = []) {
	useQueryMock.mockReturnValue({
		items,
		loadMore: jest.fn(),
		loading: false,
	});
}

function iframeResponse(savedStates: unknown[]) {
	return {data: {model: {saved_states: savedStates}}};
}

beforeEach(() => {
	jest.clearAllMocks();
	useQueryMock.mockReset();
	iframeEmbeddingMock.mockReset();
});

describe("useQuerySavedState", () => {
	it("resolves to success immediately when no savedStateId is given", () => {
		setupUseQuery();
		const {result} = renderHook(() => useQuerySavedState(null));
		expect(result.current.initialSavedState.status).toBe("success");
		expect(result.current.initialSavedState.data).toBeUndefined();
	});

	it("off-platform: resolves the saved state via iframe embedding", async () => {
		setupUseQuery();
		iframeEmbeddingMock.mockResolvedValue(iframeResponse([savedStateFixture]));

		const {result} = renderHook(() =>
			useQuerySavedState("ss-1", "model-slug", "https://platform.test"),
		);

		await waitFor(() => {
			expect(result.current.initialSavedState.status).toBe("success");
		});
		expect(result.current.initialSavedState.data).toEqual(savedStateFixture);
		expect(iframeEmbeddingMock).toHaveBeenCalledWith("model-slug", {
			saved_states: true,
		});
		expect(addItemMock).toHaveBeenCalledWith(savedStateFixture);
	});

	it("off-platform: errors when no slug is available", async () => {
		setupUseQuery();
		const {result} = renderHook(() => useQuerySavedState("ss-1"));

		await waitFor(() => {
			expect(result.current.initialSavedState.status).toBe("error");
		});
		expect(iframeEmbeddingMock).not.toHaveBeenCalled();
	});

	it("off-platform: errors when the saved state is not in the iframe response", async () => {
		setupUseQuery();
		iframeEmbeddingMock.mockResolvedValue(
			iframeResponse([{id: "other", parameters: {}}]),
		);

		const {result} = renderHook(() =>
			useQuerySavedState("ss-1", "model-slug"),
		);

		await waitFor(() => {
			expect(result.current.initialSavedState.status).toBe("error");
		});
	});

	it("off-platform: errors when iframe embedding rejects", async () => {
		setupUseQuery();
		iframeEmbeddingMock.mockRejectedValue(new Error("network"));

		const {result} = renderHook(() =>
			useQuerySavedState("ss-1", "model-slug"),
		);

		await waitFor(() => {
			expect(result.current.initialSavedState.status).toBe("error");
		});
	});
});
