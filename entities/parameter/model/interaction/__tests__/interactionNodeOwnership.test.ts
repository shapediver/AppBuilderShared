import {
	interactionOwnership as registry,
	type InteractionOwnershipEntry,
} from "../interactionOwnership";

const node = (nodeId: string, name: string) => ({nodeId, name});

type OwnershipMaps = {
	nodeToOwners: Map<string, Set<string>>;
	ownerEntries: Map<string, InteractionOwnershipEntry>;
	ownerViewports: Map<string, string>;
};

function maps(): OwnershipMaps {
	return registry as unknown as OwnershipMaps;
}

afterEach(() => registry.reset());

describe("interactionOwnership", () => {
	const vp = "vp-1";
	const deactivate = jest.fn();
	const deactivate2 = jest.fn();

	beforeEach(() => {
		deactivate.mockClear();
		deactivate2.mockClear();
	});

	it("acquires a claim when there are no conflicts", () => {
		const result = registry.acquire(
			vp,
			"owner-a",
			"Selection A",
			"selection",
			false,
			[node("n1", "out.A"), node("n2", "out.B")],
			deactivate,
			false,
		);
		expect(result.acquired).toBe(true);
		expect(registry.isAcquired("owner-a")).toBe(true);
	});

	it("releases a claim on demand", () => {
		registry.acquire(
			vp,
			"owner-a",
			"Selection A",
			"selection",
			false,
			[node("n1", "out.A")],
			deactivate,
			false,
		);
		registry.release(vp, "owner-a");
		expect(registry.isAcquired("owner-a")).toBe(false);
	});

	it("rejects automatic activation when a candidate node is already owned", () => {
		registry.acquire(
			vp,
			"owner-a",
			"Selection A",
			"selection",
			false,
			[node("n1", "out.A")],
			deactivate,
			false,
		);
		const result = registry.acquire(
			vp,
			"owner-b",
			"Selection B",
			"selection",
			false,
			[node("n1", "out.A"), node("n3", "out.C")],
			deactivate2,
			false,
		);
		expect(result.acquired).toBe(false);
		expect((result as {reason: string}).reason).toBe("node_clash");
		expect(deactivate).not.toHaveBeenCalled();
	});

	it("deactivates non-alwaysActive owner on user-requested activation", () => {
		registry.acquire(
			vp,
			"owner-a",
			"Selection A",
			"selection",
			false,
			[node("n1", "out.A")],
			deactivate,
			false,
		);
		const result = registry.acquire(
			vp,
			"owner-b",
			"Selection B",
			"selection",
			false,
			[node("n1", "out.A"), node("n3", "out.C")],
			deactivate2,
			true,
		);
		expect(result.acquired).toBe(true);
		expect(deactivate).toHaveBeenCalledTimes(1);
		expect(registry.isAcquired("owner-a")).toBe(false);
		expect(registry.isAcquired("owner-b")).toBe(true);
	});

	it("rejects user-requested activation when the conflicting owner is alwaysActive", () => {
		registry.acquire(
			vp,
			"owner-a",
			"Selection A",
			"selection",
			true,
			[node("n1", "out.A")],
			deactivate,
			false,
		);
		const result = registry.acquire(
			vp,
			"owner-b",
			"Selection B",
			"selection",
			false,
			[node("n1", "out.A")],
			deactivate2,
			true,
		);
		expect(result.acquired).toBe(false);
		expect(deactivate).not.toHaveBeenCalled();
	});

	it("deactivates multiple non-alwaysActive owners on user-requested activation", () => {
		registry.acquire(
			vp,
			"owner-a",
			"Selection A",
			"selection",
			false,
			[node("n1", "out.A")],
			deactivate,
			false,
		);
		registry.acquire(
			vp,
			"owner-c",
			"Selection C",
			"selection",
			false,
			[node("n3", "out.C")],
			deactivate2,
			false,
		);
		const result = registry.acquire(
			vp,
			"owner-b",
			"Selection B",
			"selection",
			false,
			[node("n1", "out.A"), node("n3", "out.C")],
			jest.fn(),
			true,
		);
		expect(result.acquired).toBe(true);
		expect(deactivate).toHaveBeenCalledTimes(1);
		expect(deactivate2).toHaveBeenCalledTimes(1);
		expect(registry.isAcquired("owner-a")).toBe(false);
		expect(registry.isAcquired("owner-c")).toBe(false);
		expect(registry.isAcquired("owner-b")).toBe(true);
	});

	it("rejects when any conflicting owner is alwaysActive even with non-alwaysActive present", () => {
		registry.acquire(
			vp,
			"owner-a",
			"Selection A",
			"selection",
			true,
			[node("n1", "out.A")],
			deactivate,
			false,
		);
		registry.acquire(
			vp,
			"owner-c",
			"Selection C",
			"selection",
			false,
			[node("n3", "out.C")],
			deactivate2,
			false,
		);
		const result = registry.acquire(
			vp,
			"owner-b",
			"Selection B",
			"selection",
			false,
			[node("n1", "out.A"), node("n3", "out.C")],
			jest.fn(),
			true,
		);
		expect(result.acquired).toBe(false);
		expect(deactivate).not.toHaveBeenCalled();
		expect(deactivate2).not.toHaveBeenCalled();
	});

	it("revalidates candidates and revokes claim on conflict", () => {
		const callbackB = jest.fn();
		registry.acquire(
			vp,
			"owner-a",
			"Selection A",
			"selection",
			false,
			[node("n1", "out.A")],
			deactivate,
			false,
		);
		registry.acquire(
			vp,
			"owner-b",
			"Selection B",
			"selection",
			false,
			[node("n3", "out.C")],
			callbackB,
			false,
		);
		const result = registry.update(vp, "owner-b", [
			node("n3", "out.C"),
			node("n1", "out.A"),
		]);
		expect(result.updated).toBe(false);
		expect(callbackB).toHaveBeenCalledTimes(1);
		expect(registry.isAcquired("owner-b")).toBe(false);
		expect(registry.isAcquired("owner-a")).toBe(true);
	});

	it("updates candidates without conflict when no overlap exists", () => {
		registry.acquire(
			vp,
			"owner-a",
			"Selection A",
			"selection",
			false,
			[node("n1", "out.A")],
			deactivate,
			false,
		);
		const result = registry.update(vp, "owner-a", [
			node("n1", "out.A"),
			node("n4", "out.D"),
		]);
		expect(result.updated).toBe(true);
		expect(registry.isAcquired("owner-a")).toBe(true);
	});

	it("node owners reflect the current state after release", () => {
		registry.acquire(
			vp,
			"owner-a",
			"Selection A",
			"selection",
			false,
			[node("n1", "out.A")],
			deactivate,
			false,
		);
		expect(registry.getNodeOwners(vp, "n1")).toEqual(["owner-a"]);
		registry.release(vp, "owner-a");
		expect(registry.getNodeOwners(vp, "n1")).toEqual([]);
	});

	it("acquire for an existing owner is treated as an update", () => {
		registry.acquire(
			vp,
			"owner-a",
			"Selection A",
			"selection",
			false,
			[node("n1", "out.A")],
			deactivate,
			false,
		);
		const result = registry.acquire(
			vp,
			"owner-a",
			"Selection A Updated",
			"selection",
			true,
			[node("n4", "out.D")],
			deactivate,
			false,
		);
		expect(result.acquired).toBe(true);
		expect(registry.isAcquired("owner-a")).toBe(true);
		expect(registry.getNodeOwners(vp, "n1")).toEqual([]);
		expect(registry.getNodeOwners(vp, "n4")).toEqual(["owner-a"]);
	});

	it("release is a no-op for an unknown owner", () => {
		registry.release(vp, "unknown");
		expect(registry.isAcquired("unknown")).toBe(false);
	});

	it("allows the same node id in different viewports", () => {
		registry.acquire(
			vp,
			"owner-a",
			"Selection A",
			"selection",
			false,
			[node("n1", "out.A")],
			deactivate,
			false,
		);
		const result = registry.acquire(
			"vp-2",
			"owner-b",
			"Selection B",
			"selection",
			false,
			[node("n1", "out.A")],
			deactivate2,
			false,
		);
		expect(result.acquired).toBe(true);
		expect(registry.getNodeOwners(vp, "n1")).toEqual(["owner-a"]);
		expect(registry.getNodeOwners("vp-2", "n1")).toEqual(["owner-b"]);
	});

	it("getViewportSnapshots returns entries for the given viewport only", () => {
		registry.acquire(
			vp,
			"owner-a",
			"Selection A",
			"selection",
			false,
			[node("n1", "out.A")],
			deactivate,
			false,
		);
		registry.acquire(
			"vp-2",
			"owner-b",
			"Selection B",
			"selection",
			false,
			[node("n2", "out.B")],
			deactivate2,
			false,
		);
		const vp1 = registry.getViewportSnapshots(vp);
		expect(vp1).toHaveLength(1);
		expect(vp1[0].owner).toBe("owner-a");
	});

	it("notifies subscribers until they unsubscribe", () => {
		const listener = jest.fn();
		const unsubscribe = registry.subscribe(listener);

		registry.acquire(
			vp,
			"owner-a",
			"Selection A",
			"selection",
			false,
			[node("n1", "out.A")],
			deactivate,
			false,
		);
		expect(listener).toHaveBeenCalled();

		listener.mockClear();
		registry.release(vp, "owner-a");
		expect(listener).toHaveBeenCalled();

		registry.acquire(
			vp,
			"owner-a",
			"Selection A",
			"selection",
			false,
			[node("n1", "out.A")],
			deactivate,
			false,
		);
		registry.acquire(
			vp,
			"owner-b",
			"Selection B",
			"selection",
			false,
			[node("n3", "out.C")],
			deactivate2,
			false,
		);
		listener.mockClear();
		registry.update(vp, "owner-b", [node("n1", "out.A")]);
		expect(listener).toHaveBeenCalled();

		listener.mockClear();
		registry.reset();
		expect(listener).toHaveBeenCalled();

		listener.mockClear();
		unsubscribe();
		registry.acquire(
			vp,
			"owner-a",
			"Selection A",
			"selection",
			false,
			[node("n1", "out.A")],
			deactivate,
			false,
		);
		expect(listener).not.toHaveBeenCalled();
	});

	it("rejects re-acquire when the updated candidates clash", () => {
		registry.acquire(
			vp,
			"owner-a",
			"Selection A",
			"selection",
			false,
			[node("n1", "out.A")],
			deactivate,
			false,
		);
		registry.acquire(
			vp,
			"owner-b",
			"Selection B",
			"selection",
			false,
			[node("n3", "out.C")],
			deactivate2,
			false,
		);
		const result = registry.acquire(
			vp,
			"owner-b",
			"Selection B",
			"selection",
			false,
			[node("n1", "out.A")],
			deactivate2,
			false,
		);
		expect(result.acquired).toBe(false);
		expect(registry.isAcquired("owner-b")).toBe(false);
		expect(registry.isAcquired("owner-a")).toBe(true);
	});

	it("update of an unknown owner reports failure", () => {
		const result = registry.update(vp, "unknown", [node("n1", "out.A")]);
		expect(result.updated).toBe(false);
		expect(
			(result as {conflictingOwners: string[]}).conflictingOwners,
		).toEqual([]);
	});

	it("findConflicts does not treat the owner as a clash with itself", () => {
		registry.acquire(
			vp,
			"owner-a",
			"Selection A",
			"selection",
			false,
			[node("n1", "out.A")],
			deactivate,
			false,
		);
		expect(
			registry.findConflicts(vp, "owner-a", [node("n1", "out.A")]),
		).toEqual([]);
	});

	it("user-requested acquire succeeds when a clash id has no ownership entry", () => {
		maps().nodeToOwners.set(`${vp}:n1`, new Set(["ghost"]));
		expect(() =>
			registry.acquire(
				vp,
				"owner-b",
				"Selection B",
				"selection",
				false,
				[node("n1", "out.A")],
				deactivate2,
				true,
			),
		).not.toThrow();
		expect(registry.isAcquired("owner-b")).toBe(true);
		expect(deactivate2).not.toHaveBeenCalled();
	});

	it("user-requested acquire uses the request viewport when the owner has no viewport mapping", () => {
		registry.acquire(
			vp,
			"owner-a",
			"Selection A",
			"selection",
			false,
			[node("n1", "out.A")],
			deactivate,
			false,
		);
		maps().ownerViewports.delete("owner-a");
		const result = registry.acquire(
			vp,
			"owner-b",
			"Selection B",
			"selection",
			false,
			[node("n1", "out.A")],
			deactivate2,
			true,
		);
		expect(result.acquired).toBe(true);
		expect(deactivate).toHaveBeenCalledTimes(1);
		expect(registry.getNodeOwners(vp, "n1")).toEqual(["owner-b"]);
	});

	it("getViewportSnapshots skips stale viewport keys that have no entry", () => {
		registry.acquire(
			vp,
			"owner-a",
			"Selection A",
			"selection",
			false,
			[node("n1", "out.A")],
			deactivate,
			false,
		);
		maps().ownerViewports.set("stale", vp);
		const snapshots = registry.getViewportSnapshots(vp);
		expect(snapshots).toHaveLength(1);
		expect(snapshots[0].owner).toBe("owner-a");
	});

	it("double release does not throw", () => {
		registry.acquire(
			vp,
			"owner-a",
			"Selection A",
			"selection",
			false,
			[node("n1", "out.A")],
			deactivate,
			false,
		);
		registry.release(vp, "owner-a");
		expect(() => registry.release(vp, "owner-a")).not.toThrow();
		expect(registry.getNodeOwners(vp, "n1")).toEqual([]);
	});

	it("release does not throw when the node was already unregistered", () => {
		registry.acquire(
			vp,
			"owner-a",
			"Selection A",
			"selection",
			false,
			[node("n1", "out.A")],
			deactivate,
			false,
		);
		maps().nodeToOwners.delete(`${vp}:n1`);
		expect(() => registry.release(vp, "owner-a")).not.toThrow();
		expect(registry.isAcquired("owner-a")).toBe(false);
	});

	it("keeps remaining owners on a node after one owner is released", () => {
		registry.acquire(
			vp,
			"owner-a",
			"Selection A",
			"selection",
			false,
			[node("n1", "out.A")],
			deactivate,
			false,
		);
		maps().nodeToOwners.get(`${vp}:n1`)!.add("owner-c");
		registry.release(vp, "owner-a");
		expect(registry.getNodeOwners(vp, "n1")).toEqual(["owner-c"]);
	});
});
