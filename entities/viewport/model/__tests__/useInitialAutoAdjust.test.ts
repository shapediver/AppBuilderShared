/**
 * @jest-environment jsdom
 */
import {act, renderHook} from "@testing-library/react";
import {IViewportAccessFunctions} from "../../config/shapediverStoreViewportAccessFunctions";
import {useInitialAutoAdjust} from "../useInitialAutoAdjust";
import {useShapeDiverStoreViewportAccessFunctions} from "../useShapeDiverStoreViewportAccessFunctions";

const createAccessFunctions = (
	initialAutoAdjust: boolean | undefined,
): IViewportAccessFunctions & {zoomTo: jest.Mock} => ({
	dto: {id: "viewport", initialAutoAdjust} as IViewportAccessFunctions["dto"],
	zoomTo: jest.fn(),
});

describe("useInitialAutoAdjust", () => {
	beforeEach(() => {
		jest.useFakeTimers();
		useShapeDiverStoreViewportAccessFunctions.setState({
			viewportAccessFunctions: {},
		});
	});

	afterEach(() => {
		jest.useRealTimers();
	});

	it("zooms once per viewport with initialAutoAdjust after loading", () => {
		const accessFunctions = createAccessFunctions(true);
		useShapeDiverStoreViewportAccessFunctions
			.getState()
			.addViewportAccessFunctions("viewport", accessFunctions);

		const {rerender} = renderHook(
			({loaded}: {loaded: boolean}) => useInitialAutoAdjust({loaded}),
			{initialProps: {loaded: false}},
		);

		act(() => jest.runAllTimers());
		expect(accessFunctions.zoomTo).not.toHaveBeenCalled();

		rerender({loaded: true});
		act(() => jest.runAllTimers());
		expect(accessFunctions.zoomTo).toHaveBeenCalledTimes(1);
		expect(accessFunctions.zoomTo).toHaveBeenCalledWith(false, {
			duration: 0,
		});

		// further renders must not zoom again
		rerender({loaded: true});
		act(() => jest.runAllTimers());
		expect(accessFunctions.zoomTo).toHaveBeenCalledTimes(1);
	});

	it("zooms a viewport which is created after the sessions loaded", () => {
		const {rerender} = renderHook(
			({loaded}: {loaded: boolean}) => useInitialAutoAdjust({loaded}),
			{initialProps: {loaded: true}},
		);

		const accessFunctions = createAccessFunctions(true);
		act(() => {
			useShapeDiverStoreViewportAccessFunctions
				.getState()
				.addViewportAccessFunctions("viewport", accessFunctions);
		});
		rerender({loaded: true});
		act(() => jest.runAllTimers());

		expect(accessFunctions.zoomTo).toHaveBeenCalledTimes(1);
	});

	it("leaves viewports without initialAutoAdjust untouched", () => {
		const accessFunctions = createAccessFunctions(undefined);
		useShapeDiverStoreViewportAccessFunctions
			.getState()
			.addViewportAccessFunctions("viewport", accessFunctions);

		renderHook(() => useInitialAutoAdjust({loaded: true}));
		act(() => jest.runAllTimers());

		expect(accessFunctions.zoomTo).not.toHaveBeenCalled();
	});
});
