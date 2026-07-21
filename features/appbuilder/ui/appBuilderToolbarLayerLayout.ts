import {ToolbarRegistration} from "@AppBuilderLib/features/appbuilder/config/shapediverStoreToolbars";

export type ToolbarSide = ToolbarRegistration["side"];
export type ToolbarAlign = ToolbarRegistration["align"];
export type ToolbarSlotEntries = Array<[string, ToolbarRegistration[]]>;

/** Mantine spacing token → px (theme spacing step = 0.25rem = 4px). */
const mantineSpacingPx = (token: number | string | undefined): number => {
	if (token == null) return 0;
	const n = typeof token === "number" ? token : parseInt(token, 10);
	return isNaN(n) ? 0 : n;
};

/** Rem/em string → px, assuming a 16px base. */
export const remToPx = (value: string | number | undefined): number => {
	if (value == null) return 0;
	if (typeof value === "number") return value;
	const remMatch = value.match(/([\d.]+)r?em/);
	if (remMatch) return parseFloat(remMatch[1]) * 16;
	const px = parseFloat(value);
	return isNaN(px) ? 0 : px;
};

/**
 * Computes the space a rendered toolbar occupies orthogonally to its flow.
 * This mirrors the default viewport icon composition: button + margin + paper padding + borders.
 */
export const computeToolbarThickness = (
	buttonSize: number | string,
	buttonMargin: string | number | undefined,
	paperPadding: number | string | undefined,
): number => {
	const size =
		typeof buttonSize === "number" ? buttonSize : remToPx(buttonSize);
	const margin = remToPx(buttonMargin);
	const padding = mantineSpacingPx(paperPadding);
	const border = 2;
	return size + 2 * margin + 2 * padding + border;
};

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
	const push = pushPx != null ? `${pushPx}px` : "0px";

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
				pushAxis === "left" ? `calc(${offsetX} + ${push})` : offsetX;
		}
		if (align === "center") {
			style.left = "50%";
			style.transform = "translateX(-50%)";
		}
		if (align === "end") {
			style.right =
				pushAxis === "right" ? `calc(${offsetX} + ${push})` : offsetX;
		}
	} else {
		if (align === "start") {
			style.top =
				pushAxis === "top" ? `calc(${offsetY} + ${push})` : offsetY;
		}
		if (align === "center") {
			style.top = "50%";
			style.transform = "translateY(-50%)";
		}
		if (align === "end") {
			style.bottom =
				pushAxis === "bottom" ? `calc(${offsetY} + ${push})` : offsetY;
		}
	}

	return style;
};

export const groupToolbarsBySlot = (
	toolbars: ToolbarRegistration[],
): ToolbarSlotEntries => {
	const slotMap = new Map<string, ToolbarRegistration[]>();
	for (const toolbar of toolbars) {
		const key = `${toolbar.side}:${toolbar.align}`;
		const current = slotMap.get(key) ?? [];
		current.push(toolbar);
		slotMap.set(key, current);
	}
	return Array.from(slotMap.entries());
};

export const computeToolbarPushOffsets = ({
	slotEntries,
	verticalThickness,
	horizontalThickness,
	offsetX,
	offsetY,
}: {
	slotEntries: ToolbarSlotEntries;
	verticalThickness: number;
	horizontalThickness: number;
	offsetX: string;
	offsetY: string;
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

			const minOrderA = Math.min(...toolbarsA.map((toolbar) => toolbar.order));
			const minOrderB = Math.min(...toolbarsB.map((toolbar) => toolbar.order));
			const [blockerKey, loserKey] =
				minOrderA <= minOrderB ? [keyA, keyB] : [keyB, keyA];
			const actualConflict = CORNER_CONFLICTS[`${blockerKey}|${loserKey}`];
			if (!actualConflict || offsets[loserKey]) continue;

			const thickness =
				actualConflict.blockerSide === "left" ||
				actualConflict.blockerSide === "right"
					? verticalThickness
					: horizontalThickness;
			const gap =
				actualConflict.pushAxis === "left" ||
				actualConflict.pushAxis === "right"
					? remToPx(offsetX)
					: remToPx(offsetY);

			offsets[loserKey] = {
				px: thickness + gap,
				axis: actualConflict.pushAxis,
			};
		}
	}

	return offsets;
};
