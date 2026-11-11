/**
 * @jest-environment jsdom
 */
import type {IAppBuilderParameterValueSourceDefinition} from "@AppBuilderLib/features/appbuilder/config/appbuilder";
import {renderHook, waitFor} from "@testing-library/react";

const resolvedByUseParameterValueSources = jest.fn(
	(props?: {
		namespace: string;
		sources: {
			source: IAppBuilderParameterValueSourceDefinition;
			id: string;
			namespace?: string;
		}[];
	}) => {
		if (!props?.sources.length) return undefined;
		return props.sources.map(
			({namespace: sourceNamespace, source}) =>
				`resolved:${sourceNamespace ?? props.namespace}:${source.type}`,
		);
	},
);

jest.mock("../useParameterValueSources", () => ({
	useParameterValueSources: (
		props?: Parameters<typeof resolvedByUseParameterValueSources>[0],
	) => resolvedByUseParameterValueSources(props),
}));

jest.mock("@AppBuilderLib/shared/lib/logger", () => ({
	Logger: {warn: jest.fn()},
}));

import {useResolveParameterValues} from "../useResolveParameterValues";

const sdtfSource = (name: string): IAppBuilderParameterValueSourceDefinition =>
	({
		type: "sdtf",
		props: {name, sessionId: "source"},
	}) as IAppBuilderParameterValueSourceDefinition;

describe("useResolveParameterValues", () => {
	beforeEach(() => {
		resolvedByUseParameterValueSources.mockClear();
	});

	it("resolves the same source object separately for each target session", async () => {
		const source = sdtfSource("shared_output");
		const parameterValues = [
			{id: "mesh", namespace: "session-a", value: source},
			{id: "mesh", namespace: "session-b", value: source},
		];

		const {result} = renderHook(() =>
			useResolveParameterValues({
				namespace: "default",
				parameterValues,
			}),
		);

		await waitFor(() => expect(result.current.values).toBeDefined());

		const sources = firstResolvedSources();
		expect(sources).toEqual([
			expect.objectContaining({
				source,
				id: "mesh",
				namespace: "session-a",
			}),
			expect.objectContaining({
				source,
				id: "mesh",
				namespace: "session-b",
			}),
		]);
		expect(result.current.values).toEqual([
			"resolved:session-a:sdtf",
			"resolved:session-b:sdtf",
		]);
		expect(result.current.isResolving).toBe(false);
	});

	it("resolves the same source object once when used twice in one session", async () => {
		const source = sdtfSource("shared_output");
		const parameterValues = [
			{id: "mesh-a", namespace: "session-a", value: source},
			{id: "mesh-b", namespace: "session-a", value: source},
		];

		const {result} = renderHook(() =>
			useResolveParameterValues({
				namespace: "default",
				parameterValues,
			}),
		);

		await waitFor(() => expect(result.current.values).toBeDefined());

		expect(firstResolvedSources()).toEqual([
			expect.objectContaining({
				source,
				id: "mesh-a",
				namespace: "session-a",
			}),
		]);
		expect(result.current.values).toEqual([
			"resolved:session-a:sdtf",
			"resolved:session-a:sdtf",
		]);
	});

	it("resolves two equal source objects separately for each target session", async () => {
		const sourceA = sdtfSource("shared_output");
		const sourceB = sdtfSource("shared_output");
		const parameterValues = [
			{id: "mesh", namespace: "session-a", value: sourceA},
			{id: "mesh", namespace: "session-b", value: sourceB},
		];

		const {result} = renderHook(() =>
			useResolveParameterValues({
				namespace: "default",
				parameterValues,
			}),
		);

		await waitFor(() => expect(result.current.values).toBeDefined());

		expect(firstResolvedSources()).toEqual([
			expect.objectContaining({
				source: sourceA,
				id: "mesh",
				namespace: "session-a",
			}),
			expect.objectContaining({
				source: sourceB,
				id: "mesh",
				namespace: "session-b",
			}),
		]);
		expect(result.current.values).toEqual([
			"resolved:session-a:sdtf",
			"resolved:session-b:sdtf",
		]);
	});

	it("resolves two equal source objects once in the same session", async () => {
		const sourceA = sdtfSource("shared_output");
		const sourceB = sdtfSource("shared_output");
		const parameterValues = [
			{id: "mesh-a", namespace: "session-a", value: sourceA},
			{id: "mesh-b", namespace: "session-a", value: sourceB},
		];

		const {result} = renderHook(() =>
			useResolveParameterValues({
				namespace: "default",
				parameterValues,
			}),
		);

		await waitFor(() => expect(result.current.values).toBeDefined());

		const sources = firstResolvedSources();
		expect(sources).toHaveLength(1);
		expect(sources?.[0]).toEqual(
			expect.objectContaining({
				source: sourceA,
				id: "mesh-a",
				namespace: "session-a",
			}),
		);
		expect(result.current.values).toEqual([
			"resolved:session-a:sdtf",
			"resolved:session-a:sdtf",
		]);
	});
});

function firstResolvedSources() {
	const call = resolvedByUseParameterValueSources.mock.calls.find(
		([props]) => props?.sources?.length,
	);
	return call?.[0]?.sources;
}
