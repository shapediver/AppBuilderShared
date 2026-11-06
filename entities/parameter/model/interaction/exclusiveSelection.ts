/**
 * Registry of the exclusive interaction parameter holding the selection of a
 * viewport (see the "exclusive" setting of the rectangle transform).
 *
 * At most one exclusive parameter per viewport has a selection. A parameter
 * acquires the viewport when its selection becomes non-empty, which
 * deactivates (deselects) the previous holder, and releases it when its
 * selection becomes empty or it unmounts. Viewports are independent.
 */
class ExclusiveSelectionRegistry {
	private readonly holders = new Map<
		string,
		{owner: string; onDeactivate: () => void}
	>();

	/**
	 * Make the owner the holder of the viewport. The previous holder is
	 * deactivated. Acquiring again as the current holder only updates the
	 * callback.
	 */
	public acquire(
		viewportId: string,
		owner: string,
		onDeactivate: () => void,
	) {
		const previous = this.holders.get(viewportId);
		this.holders.set(viewportId, {owner, onDeactivate});
		if (previous && previous.owner !== owner) previous.onDeactivate();
	}

	/** Release the viewport. Ignored unless the owner is the current holder. */
	public release(viewportId: string, owner: string) {
		if (this.holders.get(viewportId)?.owner === owner)
			this.holders.delete(viewportId);
	}

	public getHolder(viewportId: string): string | undefined {
		return this.holders.get(viewportId)?.owner;
	}

	public reset() {
		this.holders.clear();
	}
}

/** Singleton registry of the exclusive selection per viewport. */
export const exclusiveSelection = new ExclusiveSelectionRegistry();
