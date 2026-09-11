/**
 * @jest-environment @stryker-mutator/jest-runner/jest-env/jsdom
 */
import {act, renderHook, waitFor} from "@testing-library/react";

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

import {shouldUsePlatform} from "@AppBuilderLib/shared/lib/platform/environment";
import useQuerySavedState from "../useQuerySavedState";

function setupUseQuery(
	items: string[] = [],
	extras: {loadMore?: jest.Mock; loading?: boolean} = {},
) {
	const loadMore = extras.loadMore ?? jest.fn();
	useQueryMock.mockReturnValue({
		items,
		loadMore,
		loading: extras.loading ?? false,
	});
	return {loadMore};
}

beforeEach(() => {
	jest.clearAllMocks();
	useQueryMock.mockReset();
	currentModelMock.mockReset();
	storeItemsMock.mockReset();
	currentModelMock.mockReturnValue(undefined);
	storeItemsMock.mockReturnValue({});
	(shouldUsePlatform as jest.Mock).mockReturnValue(false);
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

		await act(async () => {
			await Promise.resolve();
			await Promise.resolve();
		});
		expect(result.current.initialSavedState.status).toBe("loading");
	});

	it("does not overwrite a resolved saved state when the store later goes empty", async () => {
		setupUseQuery();
		storeItemsMock.mockReturnValue({
			"ss-1": {data: savedStateFixture},
		});

		const {result, rerender} = renderHook(() => useQuerySavedState("ss-1"));

		await waitFor(() => {
			expect(result.current.initialSavedState.status).toBe("success");
		});

		storeItemsMock.mockReturnValue({});
		currentModelMock.mockReturnValue({id: "model-1"});
		rerender();

		await act(async () => {
			await Promise.resolve();
			await Promise.resolve();
		});
		expect(result.current.initialSavedState.status).toBe("success");
		expect(result.current.initialSavedState.data).toEqual(
			savedStateFixture,
		);
	});

	it("does not treat a loading query as missing when savedStateId becomes null", async () => {
		setupUseQuery();
		const {result, rerender} = renderHook(
			({id}: {id: string | null}) => useQuerySavedState(id),
			{initialProps: {id: "ss-1" as string | null}},
		);
		expect(result.current.initialSavedState.status).toBe("loading");

		currentModelMock.mockReturnValue({id: "model-1"});
		rerender({id: null});

		await act(async () => {
			await Promise.resolve();
			await Promise.resolve();
		});
		expect(result.current.initialSavedState.status).toBe("loading");
	});
});

describe("useQuerySavedState platform query", () => {
	function platformResponse(
		overrides: {
			success?: boolean;
			result?: unknown;
		} = {},
	) {
		return {
			success: overrides.success ?? true,
			data: {result: overrides.result ?? [savedStateFixture]},
		};
	}

	beforeEach(() => {
		(shouldUsePlatform as jest.Mock).mockReturnValue(true);
	});

	it("calls loadMore when the query has no ids and is not loading", async () => {
		const {loadMore} = setupUseQuery([], {
			loadMore: jest.fn().mockResolvedValue(undefined),
		});

		renderHook(() => useQuerySavedState("ss-1"));

		await waitFor(() => {
			expect(loadMore).toHaveBeenCalled();
		});
	});

	it("does not call loadMore when ids are already present", async () => {
		const {loadMore} = setupUseQuery(["ss-1"]);

		renderHook(() => useQuerySavedState("ss-1"));

		await act(async () => {
			await Promise.resolve();
			await Promise.resolve();
		});
		expect(loadMore).not.toHaveBeenCalled();
	});

	it("does not call loadMore while the query is still loading", async () => {
		const {loadMore} = setupUseQuery([], {loading: true});

		renderHook(() => useQuerySavedState("ss-1"));

		await act(async () => {
			await Promise.resolve();
			await Promise.resolve();
		});
		expect(loadMore).not.toHaveBeenCalled();
	});

	it("does not resolve from a seeded store row while on platform", async () => {
		setupUseQuery([], {loadMore: jest.fn().mockResolvedValue(undefined)});
		storeItemsMock.mockReturnValue({
			"ss-1": {data: savedStateFixture},
		});

		const {result} = renderHook(() => useQuerySavedState("ss-1"));

		await act(async () => {
			await Promise.resolve();
			await Promise.resolve();
		});
		expect(result.current.initialSavedState.status).toBe("loading");
	});

	it("resolves to success when the platform result contains the saved state", async () => {
		setupUseQuery([], {
			loadMore: jest.fn().mockResolvedValue(
				platformResponse({
					result: [{id: "other", name: "Other"}, savedStateFixture],
				}),
			),
		});

		const {result} = renderHook(() => useQuerySavedState("ss-1"));

		await waitFor(() => {
			expect(result.current.initialSavedState.status).toBe("success");
		});
		expect(result.current.initialSavedState.data).toEqual(
			savedStateFixture,
		);
	});

	it("errors when the platform result does not contain the saved state", async () => {
		setupUseQuery([], {
			loadMore: jest.fn().mockResolvedValue(
				platformResponse({
					result: [{id: "other", name: "Other"}],
				}),
			),
		});

		const {result} = renderHook(() => useQuerySavedState("ss-1"));

		await waitFor(() => {
			expect(result.current.initialSavedState.status).toBe("error");
		});
	});

	it("errors when loadMore resolves to an Error", async () => {
		setupUseQuery([], {
			loadMore: jest.fn().mockResolvedValue(new Error("query failed")),
		});

		const {result} = renderHook(() => useQuerySavedState("ss-1"));

		await waitFor(() => {
			expect(result.current.initialSavedState.status).toBe("error");
		});
	});

	it("errors when loadMore rejects", async () => {
		setupUseQuery([], {
			loadMore: jest.fn().mockRejectedValue(new Error("network")),
		});

		const {result} = renderHook(() => useQuerySavedState("ss-1"));

		await waitFor(() => {
			expect(result.current.initialSavedState.status).toBe("error");
		});
	});

	it("stays loading when loadMore resolves to undefined", async () => {
		setupUseQuery([], {loadMore: jest.fn().mockResolvedValue(undefined)});

		const {result} = renderHook(() => useQuerySavedState("ss-1"));

		await act(async () => {
			await Promise.resolve();
			await Promise.resolve();
		});
		expect(result.current.initialSavedState.status).toBe("loading");
	});

	it("stays loading when the platform response is unsuccessful", async () => {
		setupUseQuery([], {
			loadMore: jest
				.fn()
				.mockResolvedValue(platformResponse({success: false})),
		});

		const {result} = renderHook(() => useQuerySavedState("ss-1"));

		await act(async () => {
			await Promise.resolve();
			await Promise.resolve();
		});
		expect(result.current.initialSavedState.status).toBe("loading");
	});

	it("stays loading when the platform response has no result list", async () => {
		setupUseQuery([], {
			loadMore: jest.fn().mockResolvedValue({
				success: true,
				data: {},
			}),
		});

		const {result} = renderHook(() => useQuerySavedState("ss-1"));

		await act(async () => {
			await Promise.resolve();
			await Promise.resolve();
		});
		expect(result.current.initialSavedState.status).toBe("loading");
	});
});
