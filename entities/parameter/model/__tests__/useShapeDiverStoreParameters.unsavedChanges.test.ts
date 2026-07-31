/**
 * @jest-environment @stryker-mutator/jest-runner/jest-env/jsdom
 */
import {useShapeDiverStoreParameters} from "../useShapeDiverStoreParameters";

/**
 * Tests for the `unsavedChanges` flag on parameter history entries, which
 * drives the `beforeunload` protection prompt (SS-9721).
 *
 * The store is a singleton created at module load. Each test resets the
 * history before asserting.
 */
describe("useShapeDiverStoreParameters unsavedChanges", () => {
	const store = useShapeDiverStoreParameters;

	beforeEach(() => {
		store.getState().resetHistory();
	});

	it("initial default state entry has unsavedChanges=false", () => {
		const entry = store.getState().pushHistoryState({}, false);
		expect(entry.unsavedChanges).toBe(false);
		expect(store.getState().historyIndex).toBe(0);
		expect(store.getState().history[0].unsavedChanges).toBe(false);
	});

	it("parameter change entries default to unsavedChanges=true", () => {
		store.getState().pushHistoryState({}, false);
		const entry = store.getState().pushHistoryState({ns: {p: "v"}});
		expect(entry.unsavedChanges).toBe(true);
		expect(
			store.getState().history[store.getState().historyIndex]
				.unsavedChanges,
		).toBe(true);
	});

	it("clearUnsavedChanges clears the flag on the current entry", () => {
		store.getState().pushHistoryState({}, false);
		store.getState().pushHistoryState({ns: {p: "v"}});
		expect(
			store.getState().history[store.getState().historyIndex]
				.unsavedChanges,
		).toBe(true);

		store.getState().clearUnsavedChanges();

		expect(
			store.getState().history[store.getState().historyIndex]
				.unsavedChanges,
		).toBe(false);
	});

	it("clearUnsavedChanges syncs window.history.state when it matches the current entry", () => {
		store.getState().pushHistoryState({}, false);
		const entry = store.getState().pushHistoryState({ns: {p: "v"}});
		// Mimic historyPusher / useParameterHistory writing the entry into the
		// browser history stack.
		window.history.replaceState(entry, "");
		expect(
			(window.history.state as {unsavedChanges?: boolean}).unsavedChanges,
		).toBe(true);

		store.getState().clearUnsavedChanges();

		expect(
			(window.history.state as {unsavedChanges?: boolean}).unsavedChanges,
		).toBe(false);
		expect((window.history.state as {time?: number}).time).toBe(entry.time);
	});

	it("clearUnsavedChanges does not overwrite unrelated window.history.state", () => {
		store.getState().pushHistoryState({}, false);
		store.getState().pushHistoryState({ns: {p: "v"}});
		const unrelated = {foo: "bar"};
		window.history.replaceState(unrelated, "");

		store.getState().clearUnsavedChanges();

		expect(window.history.state).toEqual(unrelated);
		expect(
			store.getState().history[store.getState().historyIndex]
				.unsavedChanges,
		).toBe(false);
	});

	it("clearUnsavedChanges is a no-op when there is no current entry", () => {
		// history is empty after reset
		expect(store.getState().historyIndex).toBe(-1);
		expect(() => store.getState().clearUnsavedChanges()).not.toThrow();
		expect(store.getState().historyIndex).toBe(-1);
	});

	it("clearUnsavedChanges is a no-op when the flag is already false", () => {
		store.getState().pushHistoryState({}, false);
		const initialHistory = store.getState().history;
		store.getState().clearUnsavedChanges();
		// reference unchanged because no mutation was needed
		expect(store.getState().history).toBe(initialHistory);
	});

	it("clearing does not affect earlier entries", () => {
		store.getState().pushHistoryState({}, false); // index 0, clean
		store.getState().pushHistoryState({ns: {p: "a"}}); // index 1, unsaved
		store.getState().pushHistoryState({ns: {p: "b"}}); // index 2, unsaved

		store.getState().clearUnsavedChanges();

		expect(store.getState().history[0].unsavedChanges).toBe(false);
		expect(store.getState().history[1].unsavedChanges).toBe(true);
		expect(store.getState().history[2].unsavedChanges).toBe(false);
	});

	it("a new change after clearing marks the new entry as unsaved", () => {
		store.getState().pushHistoryState({}, false);
		store.getState().pushHistoryState({ns: {p: "a"}});
		store.getState().clearUnsavedChanges();

		const entry = store.getState().pushHistoryState({ns: {p: "b"}});
		expect(entry.unsavedChanges).toBe(true);
	});
});
