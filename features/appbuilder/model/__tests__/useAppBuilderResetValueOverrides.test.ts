/**
 * @jest-environment jsdom
 */
import {useShapeDiverStoreParameters} from "@AppBuilderLib/entities/parameter/model/useShapeDiverStoreParameters";
import {Logger} from "@AppBuilderLib/shared/lib/logger";
import {ISessionApi} from "@shapediver/viewer.session";
import {act, renderHook} from "@testing-library/react";
import type {
	IAppBuilder,
	IAppBuilderParameterRef,
} from "../../config/appbuilder";
import {useAppBuilderResetValueOverrides} from "../useAppBuilderResetValueOverrides";

/**
 * Tests for the registration of reset values defined by the overrides of
 * parameter references, independent of the rendered parameter components.
 */
describe("useAppBuilderResetValueOverrides", () => {
	const store = useShapeDiverStoreParameters;
	const sessionId = "session-reset-overrides";

	const createFakeSession = () =>
		({
			id: sessionId,
			parameters: {
				p1: {
					id: "p1",
					name: "p1",
					type: "String",
					defval: "a",
					value: "a",
					isValid: () => true,
					stringify: (value: unknown) => String(value),
				},
				p2: {
					id: "p2",
					name: "p2",
					type: "String",
					defval: "b",
					value: "b",
					isValid: () => true,
					stringify: (value: unknown) => String(value),
				},
			},
			exports: {},
			outputs: {},
		}) as unknown as ISessionApi;

	/** App Builder data with an accordion widget referencing the given parameters. */
	const appBuilderData = (parameters: IAppBuilderParameterRef[]) =>
		({
			version: "1.0",
			containers: [
				{
					name: "right",
					widgets: [{type: "accordion", props: {parameters}}],
				},
			],
		}) as unknown as IAppBuilder;

	const resetValueOverride = (namespace: string, id: string) =>
		store.getState().getParameter(namespace, id)?.getState()
			.resetValueOverride;

	afterEach(() => {
		store.getState().removeSession(sessionId);
		store.getState().removeSession(`${sessionId}_appbuilder`);
		jest.restoreAllMocks();
	});

	it("registers the reset value of a hidden reference", () => {
		store.getState().addSession(createFakeSession(), false);

		renderHook(() =>
			useAppBuilderResetValueOverrides({
				namespace: sessionId,
				appBuilderData: appBuilderData([
					{
						name: "p1",
						overrides: {hidden: true, settings: {resetValue: "r1"}},
					},
					{name: "p2"},
				]),
			}),
		);

		expect(resetValueOverride(sessionId, "p1")).toBe("r1");
		expect(resetValueOverride(sessionId, "p2")).toBeUndefined();
	});

	it("follows the App Builder data: removed reset values and references clear the registration", () => {
		store.getState().addSession(createFakeSession(), false);
		const {rerender} = renderHook(
			({data}: {data: IAppBuilder}) =>
				useAppBuilderResetValueOverrides({
					namespace: sessionId,
					appBuilderData: data,
				}),
			{
				initialProps: {
					data: appBuilderData([
						{name: "p1", overrides: {settings: {resetValue: "r1"}}},
						{name: "p2", overrides: {settings: {resetValue: "r2"}}},
					]),
				},
			},
		);
		expect(resetValueOverride(sessionId, "p1")).toBe("r1");
		expect(resetValueOverride(sessionId, "p2")).toBe("r2");

		// p1 is referenced without a reset value, p2 is not referenced anymore
		rerender({data: appBuilderData([{name: "p1"}])});
		expect(resetValueOverride(sessionId, "p1")).toBeUndefined();
		expect(resetValueOverride(sessionId, "p2")).toBeUndefined();

		// the reset value is defined again
		rerender({
			data: appBuilderData([
				{name: "p1", overrides: {settings: {resetValue: "r3"}}},
			]),
		});
		expect(resetValueOverride(sessionId, "p1")).toBe("r3");
	});

	it("uses the first reference defining a reset value and warns about conflicts", () => {
		const warn = jest.spyOn(Logger, "warn").mockImplementation(() => {});
		store.getState().addSession(createFakeSession(), false);

		renderHook(() =>
			useAppBuilderResetValueOverrides({
				namespace: sessionId,
				appBuilderData: appBuilderData([
					{name: "p1"},
					{name: "p1", overrides: {settings: {resetValue: "first"}}},
					{name: "p1", overrides: {settings: {resetValue: "first"}}},
					{name: "p1", overrides: {settings: {resetValue: "second"}}},
				]),
			}),
		);

		expect(resetValueOverride(sessionId, "p1")).toBe("first");
		expect(warn).toHaveBeenCalledTimes(1);
	});

	it("registers once the parameter store exists", () => {
		renderHook(() =>
			useAppBuilderResetValueOverrides({
				namespace: sessionId,
				appBuilderData: appBuilderData([
					{name: "p1", overrides: {settings: {resetValue: "r1"}}},
				]),
			}),
		);
		expect(store.getState().getParameter(sessionId, "p1")).toBeUndefined();

		act(() => {
			store.getState().addSession(createFakeSession(), false);
		});

		expect(resetValueOverride(sessionId, "p1")).toBe("r1");
	});

	it("resolves references to custom parameters by their namespace", () => {
		store.getState().addSession(createFakeSession(), false);
		store.getState().addGeneric(
			`${sessionId}_appbuilder`,
			false,
			{
				definition: {id: "c1", name: "c1", type: "String", defval: "x"},
			} as never,
			async () => undefined,
			sessionId,
		);

		renderHook(() =>
			useAppBuilderResetValueOverrides({
				namespace: sessionId,
				appBuilderData: appBuilderData([
					{
						name: "c1",
						sessionId: `${sessionId}_appbuilder`,
						overrides: {settings: {resetValue: "rc"}},
					},
				]),
			}),
		);

		expect(resetValueOverride(`${sessionId}_appbuilder`, "c1")).toBe("rc");
	});

	it("does not re-register an unchanged reset value parsed from a new response", () => {
		store.getState().addSession(createFakeSession(), false);
		const setResetValue = jest.spyOn(
			store.getState().getParameter(sessionId, "p1")!.getState().actions,
			"setResetValue",
		);
		const data = () =>
			appBuilderData([
				{name: "p1", overrides: {settings: {resetValue: "r1"}}},
			]);
		const {rerender} = renderHook(
			({data}: {data: IAppBuilder}) =>
				useAppBuilderResetValueOverrides({
					namespace: sessionId,
					appBuilderData: data,
				}),
			{initialProps: {data: data()}},
		);
		expect(setResetValue).toHaveBeenCalledTimes(1);

		rerender({data: data()});
		expect(setResetValue).toHaveBeenCalledTimes(1);
	});
});
