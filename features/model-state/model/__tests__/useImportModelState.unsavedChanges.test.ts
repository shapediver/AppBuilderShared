/**
 * @jest-environment @stryker-mutator/jest-runner/jest-env/jsdom
 */
import {act, renderHook} from "@testing-library/react";
import {useImportModelState} from "../useImportModelState";

// Mock peer dependencies of useImportModelState.
jest.mock("@mantine/core", () => {
	const actual = jest.requireActual("@mantine/core");
	return {
		...actual,
		useProps: (_name: string, _defaults: any, props: any) => props ?? {},
	};
});

const notificationMock = {
	success: jest.fn(),
	error: jest.fn(),
	warning: jest.fn(),
	info: jest.fn(),
};
jest.mock(
	"@AppBuilderLib/features/notifications/model/useNotificationStore",
	() => ({
		useNotificationStore: () => notificationMock,
	}),
);

const captureExceptionMock = jest.fn();
jest.mock("@AppBuilderLib/shared/lib/ErrorReportingContext", () => {
	const React = jest.requireActual("react");
	return {
		ErrorReportingContext: React.createContext({
			captureException: (...args: unknown[]) =>
				captureExceptionMock(...args),
			captureMessage: jest.fn(),
		}),
	};
});

const filterAndValidateModelStateParameters = jest.fn();
const generateParameterFeedback = jest.fn();
jest.mock("@AppBuilderLib/entities/parameter/lib/parametersFilter", () => ({
	filterAndValidateModelStateParameters: (...args: any[]) =>
		filterAndValidateModelStateParameters(...args),
	generateParameterFeedback: (...args: any[]) =>
		generateParameterFeedback(...args),
}));

jest.mock("@AppBuilderLib/entities/parameter/lib/parameterStates", () => ({
	getParameterStates: () => [],
}));

// Real parameter + session stores.
import {useShapeDiverStoreParameters} from "@AppBuilderLib/entities/parameter/model/useShapeDiverStoreParameters";
import {useShapeDiverStoreSession} from "@AppBuilderLib/entities/session/model/useShapeDiverStoreSession";

const paramStore = useShapeDiverStoreParameters;
const sessionStore = useShapeDiverStoreSession;

const sessionApiMock: any = {};

function seedUnsaved() {
	paramStore.getState().resetHistory();
	paramStore.getState().pushHistoryState({}, false);
	paramStore.getState().pushHistoryState({ns: {p: "changed"}});
}

function currentUnsaved() {
	const {history, historyIndex} = paramStore.getState();
	return history[historyIndex]?.unsavedChanges;
}

describe("useImportModelState unsavedChanges wiring", () => {
	beforeEach(() => {
		jest.clearAllMocks();
		Object.keys(sessionApiMock).forEach((k) => delete sessionApiMock[k]);
		Object.assign(sessionApiMock, {
			getModelState: jest
				.fn()
				.mockResolvedValue({modelState: {parameters: {paramA: 1}}}),
		});
		sessionStore.setState({sessions: {ns: sessionApiMock}});

		filterAndValidateModelStateParameters.mockReturnValue({
			hasValidParameters: true,
			validParameters: {paramA: 1},
			skippedParameters: [],
			invalidParameters: [],
		});
		generateParameterFeedback.mockReturnValue({
			type: "success",
			message: "imported",
		});
	});

	it("clears unsavedChanges after a successful model state import", async () => {
		seedUnsaved();
		expect(currentUnsaved()).toBe(true);

		const {result} = renderHook(() =>
			useImportModelState({namespace: "ns"}),
		);

		await act(async () => {
			const res = await result.current.importModelState({
				modelStateId: "abc",
			});
			expect(res.success).toBe(true);
		});

		expect(sessionApiMock.getModelState).toHaveBeenCalledWith("abc");
		expect(currentUnsaved()).toBe(false);
		expect(notificationMock.success).toHaveBeenCalledWith({
			title: undefined,
			message: "imported",
		});
	});

	it("starts with isLoading false and sets it while the import is in flight", async () => {
		let resolveGet!: (value: unknown) => void;
		sessionApiMock.getModelState = jest.fn(
			() =>
				new Promise((resolve) => {
					resolveGet = resolve;
				}),
		);

		const {result} = renderHook(() =>
			useImportModelState({namespace: "ns"}),
		);
		expect(result.current.isLoading).toBe(false);

		let importPromise!: Promise<{success: boolean}>;
		act(() => {
			importPromise = result.current.importModelState({
				modelStateId: "abc",
			});
		});
		expect(result.current.isLoading).toBe(true);

		await act(async () => {
			resolveGet({modelState: {parameters: {paramA: 1}}});
			await importPromise;
		});
		expect(result.current.isLoading).toBe(false);
	});

	it("notifies and reports when getModelState rejects", async () => {
		const err = new Error("boom");
		sessionApiMock.getModelState = jest.fn().mockRejectedValue(err);

		const {result} = renderHook(() =>
			useImportModelState({namespace: "ns"}),
		);

		await act(async () => {
			const res = await result.current.importModelState({
				modelStateId: "abc",
			});
			expect(res.success).toBe(false);
		});

		expect(notificationMock.error).toHaveBeenCalledWith({
			title: "Failed to fetch model state",
			message: "boom",
		});
		expect(captureExceptionMock).toHaveBeenCalledWith(err);
	});

	it("does not clear unsavedChanges when the model state fetch fails", async () => {
		sessionApiMock.getModelState = jest
			.fn()
			.mockResolvedValue({error: new Error("boom")});

		seedUnsaved();
		const before = currentUnsaved();

		const {result} = renderHook(() =>
			useImportModelState({namespace: "ns"}),
		);

		await act(async () => {
			const res = await result.current.importModelState({
				modelStateId: "abc",
			});
			expect(res.success).toBe(false);
		});

		expect(currentUnsaved()).toBe(before);
	});

	it("does not clear unsavedChanges when parameters are invalid", async () => {
		filterAndValidateModelStateParameters.mockReturnValue({
			hasValidParameters: false,
			validParameters: {},
			skippedParameters: [],
			invalidParameters: [],
		});
		generateParameterFeedback.mockReturnValue({
			type: "error",
			message: "invalid",
		});

		seedUnsaved();
		const before = currentUnsaved();

		const {result} = renderHook(() =>
			useImportModelState({namespace: "ns"}),
		);

		await act(async () => {
			const res = await result.current.importModelState({
				modelStateId: "abc",
			});
			expect(res.success).toBe(false);
		});

		expect(currentUnsaved()).toBe(before);
		expect(notificationMock.error).toHaveBeenCalledWith({
			title: undefined,
			message: "invalid",
		});
	});
});
