import {useShapeDiverStoreInteractionRequestManagement} from "../useShapeDiverStoreInteractionRequestManagement";

describe("useShapeDiverStoreInteractionRequestManagement", () => {
	beforeEach(() => {
		useShapeDiverStoreInteractionRequestManagement.setState({
			interactionRequests: {},
		});
	});

	it("replaces the active request without retaining the previous request", () => {
		const viewportId = "vp-1";
		const {addInteractionRequest, removeInteractionRequest} =
			useShapeDiverStoreInteractionRequestManagement.getState();

		const tokenA = addInteractionRequest({
			type: "active",
			viewportId,
			disable: jest.fn(),
		})!;
		const tokenB = addInteractionRequest({
			type: "active",
			viewportId,
			disable: jest.fn(),
		})!;

		expect(tokenB).not.toBe(tokenA);
		expect(
			useShapeDiverStoreInteractionRequestManagement.getState()
				.interactionRequests[viewportId].activeRequest?.token,
		).toBe(tokenB);

		removeInteractionRequest(tokenB);
		expect(
			useShapeDiverStoreInteractionRequestManagement.getState()
				.interactionRequests[viewportId].activeRequest,
		).toBeUndefined();
	});

	it("uses UUID request tokens", () => {
		const token = useShapeDiverStoreInteractionRequestManagement
			.getState()
			.addInteractionRequest({
				type: "active",
				viewportId: "vp-2",
				disable: jest.fn(),
			});

		expect(token).toMatch(
			/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
		);
	});
});
