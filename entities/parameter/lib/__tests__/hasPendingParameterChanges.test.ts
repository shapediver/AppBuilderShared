/**
 * @jest-environment jsdom
 */
import {useShapeDiverStoreParameters} from "../../model/useShapeDiverStoreParameters";
import {hasPendingParameterChanges} from "../hasPendingParameterChanges";

const queuedChange = {
	values: {Length: 12},
	accept: () => Promise.resolve({}),
	reject: () => undefined,
	wait: Promise.resolve({}),
	executing: false,
	priority: 0,
	addValueChange: () => undefined,
	removeValueChange: () => ({isEmpty: false, removed: false}),
};

describe("hasPendingParameterChanges", () => {
	const original = useShapeDiverStoreParameters.getState();

	afterEach(() => {
		useShapeDiverStoreParameters.setState({
			sessionDependency: original.sessionDependency,
			parameterChanges: original.parameterChanges,
		});
	});

	it("sees changes queued on the session itself", () => {
		useShapeDiverStoreParameters.setState({
			sessionDependency: {session: ["session"]},
			parameterChanges: {session: queuedChange},
		});

		expect(
			hasPendingParameterChanges(
				"session",
				useShapeDiverStoreParameters.getState(),
			),
		).toBe(true);
	});

	it("sees changes queued on a namespace that depends on the session", () => {
		useShapeDiverStoreParameters.setState({
			sessionDependency: {
				session: ["session"],
				session_appbuilder: ["session"],
			},
			parameterChanges: {session_appbuilder: queuedChange},
		});

		expect(
			hasPendingParameterChanges(
				"session",
				useShapeDiverStoreParameters.getState(),
			),
		).toBe(true);
	});

	it("ignores queued changes that belong to another session", () => {
		useShapeDiverStoreParameters.setState({
			sessionDependency: {other: ["other"]},
			parameterChanges: {other: queuedChange},
		});

		expect(
			hasPendingParameterChanges(
				"session",
				useShapeDiverStoreParameters.getState(),
			),
		).toBe(false);
	});
});
