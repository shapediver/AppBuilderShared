/**
 * @jest-environment jsdom
 */
import {useShapeDiverStoreParameters} from "../../model/useShapeDiverStoreParameters";
import {
	redoParameterHistory,
	restoreParameterHistory,
	undoParameterHistory,
} from "../undoRedoParameters";

describe("restoreParameterHistory", () => {
	it("restores the previous history index", async () => {
		const restore = jest.fn(async () => {});
		const original = useShapeDiverStoreParameters.getState();
		useShapeDiverStoreParameters.setState({
			history: [
				{state: {}, time: 1, unsavedChanges: false},
				{state: {}, time: 2, unsavedChanges: false},
			],
			historyIndex: 1,
			restoreHistoryStateFromIndex: restore,
		});
		try {
			await expect(restoreParameterHistory(-1)).resolves.toBe(true);
			expect(restore).toHaveBeenCalledWith(0);
		} finally {
			useShapeDiverStoreParameters.setState({
				history: original.history,
				historyIndex: original.historyIndex,
				restoreHistoryStateFromIndex:
					original.restoreHistoryStateFromIndex,
			});
		}
	});

	it("returns false at the start of history", async () => {
		const restore = jest.fn(async () => {});
		const original = useShapeDiverStoreParameters.getState();
		useShapeDiverStoreParameters.setState({
			history: [{state: {}, time: 1, unsavedChanges: false}],
			historyIndex: 0,
			restoreHistoryStateFromIndex: restore,
		});
		try {
			await expect(restoreParameterHistory(-1)).resolves.toBe(false);
			expect(restore).not.toHaveBeenCalled();
		} finally {
			useShapeDiverStoreParameters.setState({
				history: original.history,
				historyIndex: original.historyIndex,
				restoreHistoryStateFromIndex:
					original.restoreHistoryStateFromIndex,
			});
		}
	});
});

describe("undoParameterHistory / redoParameterHistory", () => {
	it("refuses undo when parameter changes are pending", async () => {
		const original = useShapeDiverStoreParameters.getState();
		useShapeDiverStoreParameters.setState({
			sessionDependency: {session: ["session"]},
			parameterChanges: {session: {values: {width: 1}}},
		});
		try {
			await expect(undoParameterHistory("session")).resolves.toEqual({
				success: false,
				message: "Pending parameter changes.",
			});
			await expect(redoParameterHistory("session")).resolves.toEqual({
				success: false,
				message: "Pending parameter changes.",
			});
		} finally {
			useShapeDiverStoreParameters.setState({
				sessionDependency: original.sessionDependency,
				parameterChanges: original.parameterChanges,
			});
		}
	});
});
