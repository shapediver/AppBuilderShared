/**
 * @jest-environment @stryker-mutator/jest-runner/jest-env/jsdom
 */
import {act, renderHook} from "@testing-library/react";
import {useCreateModelState} from "../useCreateModelState";

// useViewportId reads from context; mock it to a fixed viewport id.
jest.mock("@AppBuilderLib/entities/viewport/model/useViewportId", () => ({
	useViewportId: () => ({viewportId: "vp1"}),
}));

// useProps needs a Mantine provider; override only useProps, keep the rest real
// (getDefaultZIndex etc. are used transitively via the notification store).
jest.mock("@mantine/core", () => {
	const actual = jest.requireActual("@mantine/core");
	return {
		...actual,
		useProps: (_name: string, _defaults: any, props: any) => props ?? {},
	};
});

// Real stores — assertions and session state go directly against them.
import {useShapeDiverStoreParameters} from "@AppBuilderLib/entities/parameter/model/useShapeDiverStoreParameters";
import {useShapeDiverStoreSession} from "@AppBuilderLib/entities/session/model/useShapeDiverStoreSession";
import {useShapeDiverStoreViewportAccessFunctions} from "@AppBuilderLib/entities/viewport/model/useShapeDiverStoreViewportAccessFunctions";

const paramStore = useShapeDiverStoreParameters;
const sessionStore = useShapeDiverStoreSession;
const viewportAccessFunctionsStore = useShapeDiverStoreViewportAccessFunctions;

const sessionApiMock: any = {};

function setSessionApi(overrides: Partial<any> = {}) {
	Object.keys(sessionApiMock).forEach((k) => delete sessionApiMock[k]);
	Object.assign(sessionApiMock, {
		modelViewUrl: "https://backend.example.com/",
		parameters: {
			paramA: {
				id: "paramA",
				name: "Param A",
				displayname: "Param A",
				value: 1,
			},
		},
		createModelState: jest.fn().mockResolvedValue("ms-id-123"),
		...overrides,
	});
	sessionStore.setState({sessions: {ns: sessionApiMock}});
}

function seedUnsaved() {
	paramStore.getState().resetHistory();
	paramStore.getState().pushHistoryState({}, false);
	paramStore.getState().pushHistoryState({ns: {p: "changed"}});
}

function currentUnsaved() {
	const {history, historyIndex} = paramStore.getState();
	return history[historyIndex]?.unsavedChanges;
}

describe("useCreateModelState unsavedChanges wiring", () => {
	beforeEach(() => {
		setSessionApi();
		viewportAccessFunctionsStore.setState({viewportAccessFunctions: {}});
	});

	it("clears unsavedChanges after a successful user-initiated model state creation", async () => {
		seedUnsaved();
		expect(currentUnsaved()).toBe(true);

		const {result} = renderHook(() =>
			useCreateModelState({namespace: "ns"}),
		);

		await act(async () => {
			await result.current.createModelState({});
		});

		expect(sessionApiMock.createModelState).toHaveBeenCalled();
		expect(currentUnsaved()).toBe(false);
	});

	it("uses a screenshot function registered after the callback was created", async () => {
		const {result} = renderHook(() =>
			useCreateModelState({namespace: "ns"}),
		);
		const createModelState = result.current.createModelState;
		const getScreenshot = jest
			.fn()
			.mockResolvedValue("data:image/png;base64,test");

		act(() => {
			viewportAccessFunctionsStore.setState({
				viewportAccessFunctions: {
					vp1: {getScreenshot},
				},
			});
		});

		await act(async () => {
			const modelState = await createModelState({includeImage: true});
			expect(modelState.screenshot).toBe("data:image/png;base64,test");
		});

		expect(getScreenshot).toHaveBeenCalledTimes(1);
		expect(sessionApiMock.createModelState).toHaveBeenCalledWith(
			expect.any(Object),
			true,
			"data:image/png;base64,test",
			undefined,
			undefined,
		);
	});

	it("does not clear unsavedChanges when markSaved is false (value-source usage)", async () => {
		seedUnsaved();
		expect(currentUnsaved()).toBe(true);

		const {result} = renderHook(() =>
			useCreateModelState({namespace: "ns"}),
		);

		await act(async () => {
			await result.current.createModelState({}, {markSaved: false});
		});

		expect(sessionApiMock.createModelState).toHaveBeenCalled();
		expect(currentUnsaved()).toBe(true);
	});

	it("does not clear unsavedChanges when no model state id is returned", async () => {
		setSessionApi({
			createModelState: jest.fn().mockResolvedValue(undefined),
		});
		seedUnsaved();
		expect(currentUnsaved()).toBe(true);

		const {result} = renderHook(() =>
			useCreateModelState({namespace: "ns"}),
		);

		await act(async () => {
			await result.current.createModelState({});
		});

		expect(currentUnsaved()).toBe(true);
	});

	it("returns empty result and does not touch the store when the session is missing", async () => {
		seedUnsaved();
		const before = currentUnsaved();

		const {result} = renderHook(() =>
			useCreateModelState({namespace: "other"}),
		);

		await act(async () => {
			const res = await result.current.createModelState({});
			expect(res).toEqual({});
		});

		expect(currentUnsaved()).toBe(before);
	});
});
