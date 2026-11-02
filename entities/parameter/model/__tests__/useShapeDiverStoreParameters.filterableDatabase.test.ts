/**
 * @jest-environment jsdom
 */
import {ISessionApi} from "@shapediver/viewer.session";
import {IGenericParameterDefinition} from "../../config/shapediverStoreParameters";
import {
	resetFilterableDatabaseState,
	useFilterableDatabaseStateStore,
} from "../filterableDatabase/useFilterableDatabaseStateStore";
import {useShapeDiverStoreParameters} from "../useShapeDiverStoreParameters";

/**
 * Removing a session closes its saved filterable database views, so controls
 * that unmount afterwards cannot write them back. Every way of adding the
 * namespace back must reopen it.
 */
describe("useShapeDiverStoreParameters filterable database namespaces", () => {
	const store = useShapeDiverStoreParameters;
	const namespace = "ns-filterable";
	const key = `${namespace}:g1`;

	const definition = {
		definition: {id: "g1", name: "g1", type: "String", defval: "a"},
	} as unknown as IGenericParameterDefinition;
	const executor = jest.fn(async () => undefined);

	const save = () =>
		useFilterableDatabaseStateStore
			.getState()
			.saveView(key, "settings", {loadedCount: 4});
	const saved = () => useFilterableDatabaseStateStore.getState().views[key];

	beforeEach(() => {
		resetFilterableDatabaseState();
	});

	afterEach(() => {
		store.getState().removeSession(namespace);
	});

	it("drops the views of a removed session and ignores later saves", () => {
		store.getState().addGeneric(namespace, false, definition, executor, []);
		save();
		expect(saved()).toBeDefined();

		store.getState().removeSession(namespace);
		expect(saved()).toBeUndefined();

		save();
		expect(saved()).toBeUndefined();
	});

	it("reopens the namespace when generic parameters are synced back", () => {
		// useDefineGenericParameters: cleanup removes, the effect syncs again.
		store
			.getState()
			.syncGeneric(namespace, false, definition, executor, []);
		store.getState().removeSession(namespace);
		store
			.getState()
			.syncGeneric(namespace, false, definition, executor, []);

		save();
		expect(saved()?.loadedCount).toBe(4);
	});

	it("reopens the namespace when generic parameters are added back", () => {
		store.getState().addGeneric(namespace, false, definition, executor, []);
		store.getState().removeSession(namespace);
		store.getState().addGeneric(namespace, false, definition, executor, []);

		save();
		expect(saved()?.loadedCount).toBe(4);
	});

	it("reopens the namespace when the session is added back", () => {
		const session = {
			id: namespace,
			parameters: {},
			exports: {},
			outputs: {},
		} as unknown as ISessionApi;

		store.getState().addSession(session, false);
		store.getState().removeSession(namespace);
		store.getState().addSession(session, false);

		save();
		expect(saved()?.loadedCount).toBe(4);
	});
});
