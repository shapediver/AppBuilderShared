/**
 * @jest-environment jsdom
 */
import {useShapeDiverStoreParameters} from "@AppBuilderLib/entities/parameter/model/useShapeDiverStoreParameters";
import {useShapeDiverStoreSession} from "@AppBuilderLib/entities/session/model/useShapeDiverStoreSession";
import {useShapeDiverStoreViewportAccessFunctions} from "@AppBuilderLib/entities/viewport/model/useShapeDiverStoreViewportAccessFunctions";
import type {ISessionApi} from "@shapediver/viewer.session";
import {createModelStateFromStores} from "../runAppBuilderActionCreateModelState";

describe("createModelStateFromStores", () => {
	const originalSession = useShapeDiverStoreSession.getState;
	const originalViewport = useShapeDiverStoreViewportAccessFunctions.getState;
	const originalParameters = useShapeDiverStoreParameters.getState;

	afterEach(() => {
		useShapeDiverStoreSession.getState = originalSession;
		useShapeDiverStoreViewportAccessFunctions.getState = originalViewport;
		useShapeDiverStoreParameters.getState = originalParameters;
	});

	it("forwards custom metadata through theme filter defaults", async () => {
		const createModelState = jest.fn(async () => "ms-1");
		const sessionApi = {
			parameters: {},
			modelViewUrl: "https://example.com",
			createModelState,
		} as unknown as ISessionApi;
		useShapeDiverStoreSession.getState = () =>
			({
				sessions: {session: sessionApi},
			}) as unknown as ReturnType<typeof originalSession>;
		useShapeDiverStoreViewportAccessFunctions.getState = () =>
			({
				viewportAccessFunctions: {},
			}) as unknown as ReturnType<typeof originalViewport>;
		useShapeDiverStoreParameters.getState = () =>
			({
				clearUnsavedChanges: jest.fn(),
			}) as unknown as ReturnType<typeof originalParameters>;

		await createModelStateFromStores("session", "vp", {
			data: {orderId: "123"},
		});

		expect(createModelState).toHaveBeenCalledWith(
			{},
			true,
			undefined,
			{orderId: "123"},
			undefined,
		);
	});
});
