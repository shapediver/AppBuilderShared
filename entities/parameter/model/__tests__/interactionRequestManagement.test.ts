import {useShapeDiverStoreInteractionRequestManagement} from "../useShapeDiverStoreInteractionRequestManagement";

describe("useShapeDiverStoreInteractionRequestManagement", () => {
	beforeEach(() => {
		useShapeDiverStoreInteractionRequestManagement.setState({
			interactionRequests: {},
		});
	});

	it("replaces the active request without retaining the previous request", () => {
		const viewportId = "vp-1";
		const disableA = jest.fn();
		const {addInteractionRequest, removeInteractionRequest} =
			useShapeDiverStoreInteractionRequestManagement.getState();

		const tokenA = addInteractionRequest({
			type: "active",
			viewportId,
			disable: disableA,
		})!;
		const tokenB = addInteractionRequest({
			type: "active",
			viewportId,
			disable: jest.fn(),
		})!;

		expect(tokenB).not.toBe(tokenA);
		expect(disableA).toHaveBeenCalledTimes(1);
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

	it("lets a passive request take over an active interaction", () => {
		const viewportId = "vp-3";
		const activeDisable = jest.fn();
		const passiveDisable = jest.fn();
		const passiveEnable = jest.fn();
		const {addInteractionRequest, activatePassiveInteraction} =
			useShapeDiverStoreInteractionRequestManagement.getState();

		addInteractionRequest({
			type: "active",
			viewportId,
			disable: activeDisable,
		});
		const passiveToken = addInteractionRequest({
			type: "passive",
			viewportId,
			disable: passiveDisable,
			enable: passiveEnable,
		})!;

		expect(passiveDisable).toHaveBeenCalledTimes(1);

		activatePassiveInteraction(passiveToken);

		expect(activeDisable).toHaveBeenCalledTimes(1);
		expect(passiveEnable).toHaveBeenCalledTimes(1);
		expect(
			useShapeDiverStoreInteractionRequestManagement.getState()
				.interactionRequests[viewportId].activeRequest,
		).toBeUndefined();
	});

	it("does not disable a passive request when no active request exists", () => {
		const disablePassive = jest.fn();
		useShapeDiverStoreInteractionRequestManagement
			.getState()
			.addInteractionRequest({
				type: "passive",
				viewportId: "vp-4",
				disable: disablePassive,
				enable: jest.fn(),
			});
		expect(disablePassive).not.toHaveBeenCalled();
	});

	it("disables existing passives when an active request is added", () => {
		const viewportId = "vp-5";
		const disablePassive = jest.fn();
		const {addInteractionRequest} =
			useShapeDiverStoreInteractionRequestManagement.getState();

		addInteractionRequest({
			type: "passive",
			viewportId,
			disable: disablePassive,
			enable: jest.fn(),
		});
		addInteractionRequest({
			type: "active",
			viewportId,
			disable: jest.fn(),
		});
		expect(disablePassive).toHaveBeenCalledTimes(1);
	});

	it("removes a passive request by token and leaves the active request", () => {
		const viewportId = "vp-6";
		const {addInteractionRequest, removeInteractionRequest} =
			useShapeDiverStoreInteractionRequestManagement.getState();

		const activeToken = addInteractionRequest({
			type: "active",
			viewportId,
			disable: jest.fn(),
		})!;
		const passiveA = addInteractionRequest({
			type: "passive",
			viewportId,
			disable: jest.fn(),
			enable: jest.fn(),
		})!;
		const passiveB = addInteractionRequest({
			type: "passive",
			viewportId,
			disable: jest.fn(),
			enable: jest.fn(),
		})!;

		removeInteractionRequest(passiveB);

		const state =
			useShapeDiverStoreInteractionRequestManagement.getState()
				.interactionRequests[viewportId];
		expect(state.activeRequest?.token).toBe(activeToken);
		expect(state.passiveRequests.map((req) => req.token)).toEqual([
			passiveA,
		]);
	});

	it("leaves passives unchanged when removing an unknown token", () => {
		const viewportId = "vp-7";
		const {addInteractionRequest, removeInteractionRequest} =
			useShapeDiverStoreInteractionRequestManagement.getState();

		addInteractionRequest({
			type: "passive",
			viewportId,
			disable: jest.fn(),
			enable: jest.fn(),
		});
		removeInteractionRequest("not-a-token");

		expect(
			useShapeDiverStoreInteractionRequestManagement.getState()
				.interactionRequests[viewportId].passiveRequests,
		).toHaveLength(1);
	});

	it("enables passives when the active request is removed", () => {
		const viewportId = "vp-8";
		const enable = jest.fn();
		const {addInteractionRequest, removeInteractionRequest} =
			useShapeDiverStoreInteractionRequestManagement.getState();

		const activeToken = addInteractionRequest({
			type: "active",
			viewportId,
			disable: jest.fn(),
		})!;
		addInteractionRequest({
			type: "passive",
			viewportId,
			disable: jest.fn(),
			enable,
		});
		removeInteractionRequest(activeToken);
		expect(enable).toHaveBeenCalledTimes(1);
	});

	it("does not clear another viewport when removing an active request", () => {
		const {addInteractionRequest, removeInteractionRequest} =
			useShapeDiverStoreInteractionRequestManagement.getState();

		const tokenA = addInteractionRequest({
			type: "active",
			viewportId: "vp-a",
			disable: jest.fn(),
		})!;
		const tokenB = addInteractionRequest({
			type: "active",
			viewportId: "vp-b",
			disable: jest.fn(),
		})!;
		removeInteractionRequest(tokenA);

		const state =
			useShapeDiverStoreInteractionRequestManagement.getState()
				.interactionRequests;
		expect(state["vp-a"].activeRequest).toBeUndefined();
		expect(state["vp-b"].activeRequest?.token).toBe(tokenB);
	});

	it("ignores activatePassiveInteraction for an unknown token", () => {
		const disable = jest.fn();
		const {addInteractionRequest, activatePassiveInteraction} =
			useShapeDiverStoreInteractionRequestManagement.getState();

		addInteractionRequest({
			type: "active",
			viewportId: "vp-9",
			disable,
		});
		activatePassiveInteraction("not-a-token");

		expect(disable).not.toHaveBeenCalled();
		expect(
			useShapeDiverStoreInteractionRequestManagement.getState()
				.interactionRequests["vp-9"].activeRequest,
		).toBeDefined();
	});

	it("activates a passive request in the matching viewport only", () => {
		const disableA = jest.fn();
		const disableB = jest.fn();
		const {addInteractionRequest, activatePassiveInteraction} =
			useShapeDiverStoreInteractionRequestManagement.getState();

		addInteractionRequest({
			type: "active",
			viewportId: "vp-a",
			disable: disableA,
		});
		addInteractionRequest({
			type: "active",
			viewportId: "vp-b",
			disable: disableB,
		});
		addInteractionRequest({
			type: "passive",
			viewportId: "vp-a",
			disable: jest.fn(),
			enable: jest.fn(),
		});
		const tokenB = addInteractionRequest({
			type: "passive",
			viewportId: "vp-b",
			disable: jest.fn(),
			enable: jest.fn(),
		})!;

		activatePassiveInteraction(tokenB);

		expect(disableB).toHaveBeenCalledTimes(1);
		expect(disableA).not.toHaveBeenCalled();
	});

	it("activates a passive request when no active request exists", () => {
		const enable = jest.fn();
		const {addInteractionRequest, activatePassiveInteraction} =
			useShapeDiverStoreInteractionRequestManagement.getState();

		const token = addInteractionRequest({
			type: "passive",
			viewportId: "vp-10",
			disable: jest.fn(),
			enable,
		})!;

		expect(() => activatePassiveInteraction(token)).not.toThrow();
		expect(enable).toHaveBeenCalledTimes(1);
	});
});
