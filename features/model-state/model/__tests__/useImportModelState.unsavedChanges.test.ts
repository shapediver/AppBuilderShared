/**
 * @jest-environment jsdom
 */
import {act, renderHook} from "@testing-library/react";
import * as React from "react";
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

jest.mock("@AppBuilderLib/shared/lib/ErrorReportingContext", () => ({
	ErrorReportingContext: React.createContext({captureException: jest.fn()}),
}));

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
	});
});
