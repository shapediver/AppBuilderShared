/**
 * Runtime node-clash ownership registry for interaction parameters.
 *
 * Each active interaction parameter (selection, dragging, gumball,
 * rectangle transform) "owns" its resolved candidate nodes. Two active
 * interactions must never own the same candidate node within a viewport.
 *
 * ### Activation policy
 *
 * | Request source | Clash outcome |
 * |---|---|
 * | Automatic (`alwaysActive` / `activeOnStart`) | Reject activation; warn. |
 * | User-requested vs non-alwaysActive owner | Deactivate the owner, then activate. |
 * | User-requested vs alwaysActive owner | Reject activation; warn. |
 *
 * All functions are synchronous and side-effect-free except the deactivation
 * callbacks invoked on conflicting owners during `acquire`.
 */
class InteractionOwnershipRegistry {
	private readonly nodeToOwners = new Map<string, Set<string>>();
	private readonly ownerEntries = new Map<
		string,
		InteractionOwnershipEntry
	>();
	private readonly ownerViewports = new Map<string, string>();

	public acquire(
		viewportId: string,
		owner: string,
		label: string,
		type: string,
		alwaysActive: boolean,
		candidates: CandidateNode[],
		onDeactivate: () => void,
		userRequested: boolean,
	): AcquireResult {
		if (this.ownerEntries.has(owner)) {
			const result = this.update(viewportId, owner, candidates);
			return result.updated
				? {acquired: true}
				: {
						acquired: false,
						reason: result.reason,
						conflictingOwners: result.conflictingOwners,
					};
		}

		const conflicts = this.findConflicts(viewportId, owner, candidates);
		if (conflicts.length > 0) {
			if (!userRequested) {
				return {
					acquired: false,
					reason: "node_clash",
					conflictingOwners: conflicts,
				};
			}
			if (
				conflicts.some((id) => this.ownerEntries.get(id)?.alwaysActive)
			) {
				return {
					acquired: false,
					reason: "node_clash",
					conflictingOwners: conflicts,
				};
			}

			conflicts.forEach((id) => {
				const entry = this.ownerEntries.get(id);
				if (!entry) return;
				this.release(this.ownerViewports.get(id) ?? viewportId, id);
				entry.onDeactivate();
			});
		}

		this.register(viewportId, {
			owner,
			label,
			type,
			alwaysActive,
			candidates,
			onDeactivate,
		});
		return {acquired: true};
	}

	public findConflicts(
		viewportId: string,
		owner: string,
		candidates: CandidateNode[],
	) {
		const conflicts = new Set<string>();
		candidates.forEach(({nodeId}) => {
			this.nodeToOwners
				.get(this.nodeKey(viewportId, nodeId))
				?.forEach((other) => {
					if (other !== owner) conflicts.add(other);
				});
		});
		return Array.from(conflicts);
	}

	public getNodeOwners(viewportId: string, nodeId: string) {
		return Array.from(
			this.nodeToOwners.get(this.nodeKey(viewportId, nodeId)) ?? [],
		);
	}

	public getViewportSnapshots(viewportId: string) {
		return Array.from(this.ownerViewports.entries())
			.filter(([, ownerViewportId]) => ownerViewportId === viewportId)
			.map(([owner]) => this.ownerEntries.get(owner))
			.filter((entry): entry is InteractionOwnershipEntry => !!entry);
	}

	public isAcquired(owner: string) {
		return this.ownerEntries.has(owner);
	}

	public release(viewportId: string, owner: string) {
		const entry = this.ownerEntries.get(owner);
		if (!entry) return;
		this.unregisterNodes(viewportId, owner, entry.candidates);
		this.ownerEntries.delete(owner);
		this.ownerViewports.delete(owner);
	}

	public reset() {
		this.ownerEntries.clear();
		this.ownerViewports.clear();
		this.nodeToOwners.clear();
	}

	public update(
		viewportId: string,
		owner: string,
		candidates: CandidateNode[],
	): UpdateResult {
		const entry = this.ownerEntries.get(owner);
		if (!entry) {
			return {
				updated: false,
				reason: "node_clash",
				conflictingOwners: [],
			};
		}

		this.unregisterNodes(viewportId, owner, entry.candidates);
		const conflicts = this.findConflicts(viewportId, owner, candidates);
		if (conflicts.length > 0) {
			this.ownerEntries.delete(owner);
			this.ownerViewports.delete(owner);
			entry.onDeactivate();
			return {
				updated: false,
				reason: "node_clash",
				conflictingOwners: conflicts,
			};
		}

		entry.candidates = candidates;
		this.registerNodes(viewportId, owner, candidates);
		return {updated: true};
	}

	private nodeKey(viewportId: string, nodeId: string) {
		return `${viewportId}:${nodeId}`;
	}

	private register(viewportId: string, entry: InteractionOwnershipEntry) {
		this.ownerEntries.set(entry.owner, entry);
		this.ownerViewports.set(entry.owner, viewportId);
		this.registerNodes(viewportId, entry.owner, entry.candidates);
	}

	private registerNodes(
		viewportId: string,
		owner: string,
		candidates: CandidateNode[],
	) {
		candidates.forEach(({nodeId}) => {
			const key = this.nodeKey(viewportId, nodeId);
			const owners = this.nodeToOwners.get(key) ?? new Set<string>();
			owners.add(owner);
			this.nodeToOwners.set(key, owners);
		});
	}

	private unregisterNodes(
		viewportId: string,
		owner: string,
		candidates: CandidateNode[],
	) {
		candidates.forEach(({nodeId}) => {
			const key = this.nodeKey(viewportId, nodeId);
			const owners = this.nodeToOwners.get(key);
			if (!owners) return;
			owners.delete(owner);
			if (owners.size === 0) this.nodeToOwners.delete(key);
		});
	}
}

export type AcquireResult =
	| {acquired: true}
	| {acquired: false; reason: "node_clash"; conflictingOwners: string[]};

export type CandidateNode = {
	/** Human-readable node name used by the interaction system. */
	name: string;

	/** Stable viewer node identity. */
	nodeId: string;
};

export type InteractionOwnershipEntry = {
	/** Whether this owner cannot be deactivated by another interaction. */
	alwaysActive: boolean;

	/** Current candidate node set. */
	candidates: CandidateNode[];

	/** Human-readable label for warnings. */
	label: string;

	/** Unique owner id (e.g. `${namespace}-${parameterId}-${viewportId}`). */
	owner: string;

	/** Interaction type for diagnostics. */
	type: string;

	/**
	 * Stable callback invoked by the registry when this owner's claim is
	 * released externally (e.g. conflict resolution or `update` failure).
	 * Must synchronously deactivate the interaction and release the claim.
	 */
	onDeactivate: () => void;
};

export type UpdateResult =
	| {updated: true}
	| {updated: false; reason: "node_clash"; conflictingOwners: string[]};

/** Singleton registry for interaction-node ownership. */
export const interactionOwnership = new InteractionOwnershipRegistry();
