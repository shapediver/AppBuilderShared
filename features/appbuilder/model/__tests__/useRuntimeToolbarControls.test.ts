/**
 * @jest-environment @stryker-mutator/jest-runner/jest-env/jsdom
 */
import {renderHook} from "@testing-library/react";
import {useRuntimeToolbarControls} from "../useRuntimeToolbarControls";
import {useShapeDiverStoreToolbars} from "../useShapeDiverStoreToolbars";

describe("useRuntimeToolbarControls", () => {
	beforeEach(() => {
		useShapeDiverStoreToolbars.setState({
			definitionToolbars: [],
			defaultToolbars: [],
			runtimeToolbars: [],
			runtimeTokens: {},
		});
	});

	it("adds controls and cleans them up on unmount", () => {
		const {result, unmount} = renderHook(() =>
			useRuntimeToolbarControls(),
		);

		result.current.addControls(
			{
				fallbackSide: "top",
				fallbackAlign: "center",
				createIfMissing: true,
			},
			[
				{
					type: "action",
					props: {
						definition: {
							type: "camera",
							props: {type: "zoomTo", props: {}},
						},
					},
				},
			],
		);

		expect(
			useShapeDiverStoreToolbars.getState().runtimeToolbars,
		).toHaveLength(1);
		unmount();
		expect(
			useShapeDiverStoreToolbars.getState().runtimeToolbars,
		).toHaveLength(0);
	});

	it("supports multiple registrations and manual token removal", () => {
		const {result} = renderHook(() =>
			useRuntimeToolbarControls(),
		);

		const first = result.current.addControls(
			{
				fallbackSide: "top",
				fallbackAlign: "center",
				createIfMissing: true,
			},
			[
				{
					type: "action",
					props: {
						definition: {
							type: "camera",
							props: {type: "zoomTo", props: {}},
						},
					},
				},
			],
		);
		const second = result.current.addControls(
			{
				fallbackSide: "top",
				fallbackAlign: "center",
				createIfMissing: true,
			},
			[
				{
					type: "action",
					props: {
						definition: {
							type: "resetParameterValues",
							props: {},
						},
					},
				},
			],
		);

		expect(
			useShapeDiverStoreToolbars.getState().runtimeTokens[first],
		).toBeDefined();
		expect(
			useShapeDiverStoreToolbars.getState().runtimeTokens[second],
		).toBeDefined();

		result.current.removeToken(first);
		expect(
			useShapeDiverStoreToolbars.getState().runtimeTokens[first],
		).toBeUndefined();
		expect(
			useShapeDiverStoreToolbars.getState().runtimeTokens[second],
		).toBeDefined();
	});
});
