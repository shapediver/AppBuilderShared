/**
 * @jest-environment jsdom
 */
import {renderHook, waitFor} from "@testing-library/react";

const savedStateFixture = {
	id: "ss-1",
	name: "SS-01",
	parameters: {width: "2", height: "7"},
};

// Mock the platform environment helpers.
jest.mock("@AppBuilderLib/shared/lib/platform/environment", () => ({
	shouldUsePlatform: jest.fn(() => false),
}));

// Mock the platform store (provides currentModel).
const currentModelMock = jest.fn(() => undefined);
jest.mock("@AppBuilderLib/shared/model/useShapeDiverStorePlatform", () => ({
	useShapeDiverStorePlatform: (selector: (s: unknown) => unknown) =>
		selector({currentModel: currentModelMock()}),
}));

// Mock the saved-states store.
const useQueryMock = jest.fn();
const storeItemsMock = jest.fn(() => ({}));
jest.mock("../useShapeDiverStorePlatformSavedStates", () => ({
	useShapeDiverStorePlatformSavedStates: (
		selector: (s: unknown) => unknown,
	) =>
		selector({
			useQuery: useQueryMock,
			items: storeItemsMock(),
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

beforeEach(() => {
	jest.clearAllMocks();
	useQueryMock.mockReset();
	currentModelMock.mockReset();
	storeItemsMock.mockReset();
	currentModelMock.mockReturnValue(undefined);
	storeItemsMock.mockReturnValue({});
});

describe("useQuerySavedState", () => {
	it("resolves to success immediately when no savedStateId is given", () => {
		setupUseQuery();
		const {result} = renderHook(() => useQuerySavedState(null));
		expect(result.current.initialSavedState.status).toBe("success");
		expect(result.current.initialSavedState.data).toBeUndefined();
	});

	it("off-platform: resolves to success when the saved state is in the store", async () => {
		setupUseQuery();
		storeItemsMock.mockReturnValue({
			"ss-1": {data: savedStateFixture},
		});

		const {result} = renderHook(() => useQuerySavedState("ss-1"));

		await waitFor(() => {
			expect(result.current.initialSavedState.status).toBe("success");
		});
		expect(result.current.initialSavedState.data).toEqual(
			savedStateFixture,
		);
	});

	it("off-platform: errors when resolve finished (currentModel set) but the saved state is missing", async () => {
		setupUseQuery();
		currentModelMock.mockReturnValue({id: "model-1"});

		const {result} = renderHook(() => useQuerySavedState("ss-1"));

		await waitFor(() => {
			expect(result.current.initialSavedState.status).toBe("error");
		});
	});

	it("off-platform: stays loading when the store is empty and resolve has not run yet", async () => {
		setupUseQuery();

		const {result} = renderHook(() => useQuerySavedState("ss-1"));

		// Give the async effect a chance to run.
		await Promise.resolve();
		expect(result.current.initialSavedState.status).toBe("loading");
	});
});
