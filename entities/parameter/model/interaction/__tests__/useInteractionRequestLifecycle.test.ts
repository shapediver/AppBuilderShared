/**
 * @jest-environment jsdom
 */
import {useShapeDiverStoreInteractionRequestManagement} from "@AppBuilderLib/entities/parameter/model/useShapeDiverStoreInteractionRequestManagement";
import {renderHook} from "@testing-library/react";
import {useInteractionRequestLifecycle} from "../useInteractionRequestLifecycle";

const viewportId = "viewport-lifecycle";

/** Start an active interaction (e.g. a placement) and return its removal. */
const startActiveInteraction = () => {
	const {addInteractionRequest, removeInteractionRequest} =
		useShapeDiverStoreInteractionRequestManagement.getState();
	const token = addInteractionRequest({
		type: "active",
		viewportId,
		disable: jest.fn(),
	});
	return () => removeInteractionRequest(token);
};

describe("useInteractionRequestLifecycle", () => {
	afterEach(() => {
		useShapeDiverStoreInteractionRequestManagement.setState({
			interactionRequests: {},
		});
	});

	it("only suspends and resumes a persistent interaction around an active one", () => {
		const onDisable = jest.fn();
		const onSuspend = jest.fn();
		const onResume = jest.fn();
		renderHook(() =>
			useInteractionRequestLifecycle({
				viewportId,
				active: true,
				persistent: true,
				onDisable,
				onSuspend,
				onResume,
				setDisableOtherParameters: jest.fn(),
			}),
		);

		const end = startActiveInteraction();
		expect(onSuspend).toHaveBeenCalledTimes(1);
		// onSuspend returns nothing, that must not fall back to disabling
		expect(onDisable).not.toHaveBeenCalled();

		end();
		expect(onResume).toHaveBeenCalledTimes(1);
		expect(onDisable).not.toHaveBeenCalled();
	});

	it("disables a persistent interaction which cannot be suspended", () => {
		const onDisable = jest.fn();
		renderHook(() =>
			useInteractionRequestLifecycle({
				viewportId,
				active: true,
				persistent: true,
				onDisable,
				setDisableOtherParameters: jest.fn(),
			}),
		);

		startActiveInteraction();
		expect(onDisable).toHaveBeenCalledTimes(1);
	});
});
