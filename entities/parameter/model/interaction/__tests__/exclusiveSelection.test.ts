import {exclusiveSelection} from "../exclusiveSelection";

afterEach(() => exclusiveSelection.reset());

describe("exclusiveSelection", () => {
	it("deactivates the previous holder on acquire", () => {
		const deactivateA = jest.fn();
		const deactivateB = jest.fn();
		exclusiveSelection.acquire("v", "a", deactivateA);
		exclusiveSelection.acquire("v", "b", deactivateB);

		expect(deactivateA).toHaveBeenCalledTimes(1);
		expect(deactivateB).not.toHaveBeenCalled();
		expect(exclusiveSelection.getHolder("v")).toBe("b");
	});

	it("does not deactivate the holder when it acquires again", () => {
		const deactivate = jest.fn();
		const deactivateUpdated = jest.fn();
		exclusiveSelection.acquire("v", "a", deactivate);
		exclusiveSelection.acquire("v", "a", deactivateUpdated);
		exclusiveSelection.acquire("v", "b", jest.fn());

		expect(deactivate).not.toHaveBeenCalled();
		expect(deactivateUpdated).toHaveBeenCalledTimes(1);
	});

	it("ignores a release by a stale owner", () => {
		const deactivateB = jest.fn();
		exclusiveSelection.acquire("v", "a", jest.fn());
		exclusiveSelection.acquire("v", "b", deactivateB);
		exclusiveSelection.release("v", "a");

		expect(exclusiveSelection.getHolder("v")).toBe("b");
		exclusiveSelection.acquire("v", "c", jest.fn());
		expect(deactivateB).toHaveBeenCalledTimes(1);
	});

	it("releases the viewport for the current holder", () => {
		const deactivateA = jest.fn();
		exclusiveSelection.acquire("v", "a", deactivateA);
		exclusiveSelection.release("v", "a");
		exclusiveSelection.acquire("v", "b", jest.fn());

		expect(exclusiveSelection.getHolder("v")).toBe("b");
		expect(deactivateA).not.toHaveBeenCalled();
	});

	it("keeps viewports independent", () => {
		const deactivateA = jest.fn();
		exclusiveSelection.acquire("v1", "a", deactivateA);
		exclusiveSelection.acquire("v2", "b", jest.fn());

		expect(deactivateA).not.toHaveBeenCalled();
		expect(exclusiveSelection.getHolder("v1")).toBe("a");
		expect(exclusiveSelection.getHolder("v2")).toBe("b");
	});
});
