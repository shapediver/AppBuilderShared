import {ToolbarRegistration} from "@AppBuilderLib/features/appbuilder/config/shapediverStoreToolbars";

export type ToolbarSide = ToolbarRegistration["side"];
export type ToolbarAlign = ToolbarRegistration["align"];
type ToolbarLayoutItem = Pick<ToolbarRegistration, "side" | "align" | "order">;
export type ToolbarSlotEntries<
	T extends ToolbarLayoutItem = ToolbarRegistration,
> = Array<[string, T[]]>;

interface CornerConflict {
	blockerSide: ToolbarSide;
	loserSide: ToolbarSide;
	pushAxis: "left" | "right" | "top" | "bottom";
}

const CORNER_CONFLICTS: Record<string, CornerConflict> = {
	"left:end|bottom:start": {
		blockerSide: "left",
		loserSide: "bottom",
		pushAxis: "left",
	},
	"right:end|bottom:end": {
		blockerSide: "right",
		loserSide: "bottom",
		pushAxis: "right",
	},
	"left:start|top:start": {
		blockerSide: "left",
		loserSide: "top",
		pushAxis: "left",
	},
	"right:start|top:end": {
		blockerSide: "right",
		loserSide: "top",
		pushAxis: "right",
	},
	"bottom:start|left:end": {
		blockerSide: "bottom",
		loserSide: "left",
		pushAxis: "bottom",
	},
	"bottom:end|right:end": {
		blockerSide: "bottom",
		loserSide: "right",
		pushAxis: "bottom",
	},
	"top:start|left:start": {
		blockerSide: "top",
		loserSide: "left",
		pushAxis: "top",
	},
	"top:end|right:start": {
		blockerSide: "top",
		loserSide: "right",
		pushAxis: "top",
	},
};

/** Cross-axis size of a rendered slot. Top/bottom use height; left/right use width. */
export const slotCrossAxisPx = (
	side: ToolbarSide,
	element: {offsetWidth: number; offsetHeight: number},
): number =>
	side === "left" || side === "right"
		? element.offsetWidth
		: element.offsetHeight;

const pushedInset = (offset: string, pushPx: number | undefined): string =>
	pushPx != null && pushPx > 0
		? `calc(${offset} + ${pushPx}px + ${offset})`
		: offset;

export const getToolbarSlotStyle = (
	side: ToolbarSide,
	align: ToolbarAlign,
	offsetX: string,
	offsetY: string,
	pushPx?: number,
	pushAxis?: "left" | "right" | "top" | "bottom",
): React.CSSProperties => {
	const style: React.CSSProperties = {
		position: "absolute",
		display: "flex",
		gap: "0.5rem",
		pointerEvents: "none",
		alignItems: "flex-start",
	};

	switch (side) {
		case "top":
			style.top = offsetY;
			style.flexDirection = "row";
			break;
		case "bottom":
			style.bottom = offsetY;
			style.flexDirection = "row";
			break;
		case "left":
			style.left = offsetX;
			style.flexDirection = "column";
			break;
		case "right":
			style.right = offsetX;
			style.flexDirection = "column";
			break;
	}

	if (side === "top" || side === "bottom") {
		if (align === "start") {
			style.left =
				pushAxis === "left" ? pushedInset(offsetX, pushPx) : offsetX;
		}
		if (align === "center") {
			style.left = "50%";
			style.transform = "translateX(-50%)";
		}
		if (align === "end") {
			style.right =
				pushAxis === "right" ? pushedInset(offsetX, pushPx) : offsetX;
		}
	} else {
		if (align === "start") {
			style.top =
				pushAxis === "top" ? pushedInset(offsetY, pushPx) : offsetY;
		}
		if (align === "center") {
			style.top = "50%";
			style.transform = "translateY(-50%)";
		}
		if (align === "end") {
			style.bottom =
				pushAxis === "bottom" ? pushedInset(offsetY, pushPx) : offsetY;
		}
	}

	return style;
};

export const groupToolbarsBySlot = <T extends ToolbarLayoutItem>(
	toolbars: T[],
): ToolbarSlotEntries<T> => {
	const slotMap = new Map<string, T[]>();
	for (const toolbar of toolbars) {
		const key = `${toolbar.side}:${toolbar.align}`;
		const current = slotMap.get(key) ?? [];
		current.push(toolbar);
		slotMap.set(key, current);
	}
	return Array.from(slotMap.entries());
};

export const computeToolbarPushOffsets = <T extends ToolbarLayoutItem>({
	slotEntries,
	thicknessBySlot,
}: {
	slotEntries: ToolbarSlotEntries<T>;
	/** Measured cross-axis size of each `side:align` slot, in px. */
	thicknessBySlot: Record<string, number>;
}) => {
	const offsets: Record<
		string,
		{px: number; axis: "left" | "right" | "top" | "bottom"}
	> = {};

	for (const [keyA, toolbarsA] of slotEntries) {
		for (const [keyB, toolbarsB] of slotEntries) {
			if (keyA === keyB || keyA > keyB) continue;

			const conflict = CORNER_CONFLICTS[`${keyA}|${keyB}`];
			if (!conflict) continue;

			const minOrderA = Math.min(
				...toolbarsA.map((toolbar) => toolbar.order),
			);
			const minOrderB = Math.min(
				...toolbarsB.map((toolbar) => toolbar.order),
			);
			const [blockerKey, loserKey] =
				minOrderA <= minOrderB ? [keyA, keyB] : [keyB, keyA];
			const actualConflict =
				CORNER_CONFLICTS[`${blockerKey}|${loserKey}`];
			if (!actualConflict || offsets[loserKey]) continue;

			offsets[loserKey] = {
				px: thicknessBySlot[blockerKey] ?? 0,
				axis: actualConflict.pushAxis,
			};
		}
	}

	return offsets;
};

/**
 * Keeps a slot's last positive cross-axis size while it is in the DOM but
 * hidden (`onMouseActivity` Activity/`display: none` measures as 0). Dropping
 * that size would let the neighboring toolbar move into the corner and overlap
 * the hidden toolbar when it appears.
 */
export const mergeMeasuredSlotThickness = (
	current: Record<string, number>,
	measured: Record<string, number>,
	presentKeys: readonly string[],
): Record<string, number> => {
	const next: Record<string, number> = {};
	for (const key of presentKeys) {
		const size = measured[key] ?? current[key];
		if (size != null && size > 0) next[key] = size;
	}
	return next;
};
