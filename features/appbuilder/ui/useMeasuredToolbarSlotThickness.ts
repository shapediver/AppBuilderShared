import {RefObject, useLayoutEffect, useState} from "react";
import {flushSync} from "react-dom";
import {
	mergeMeasuredSlotThickness,
	slotCrossAxisPx,
	ToolbarSide,
} from "./appBuilderToolbarLayerLayout";

const sameThickness = (
	current: Record<string, number>,
	next: Record<string, number>,
) => {
	const currentKeys = Object.keys(current);
	const nextKeys = Object.keys(next);
	return (
		currentKeys.length === nextKeys.length &&
		nextKeys.every((key) => current[key] === next[key])
	);
};

/**
 * Cross-axis size of each rendered toolbar slot.
 * Measured from the DOM so theme, font, padding, border, and captions are
 * whatever the browser actually laid out.
 */
export function useMeasuredToolbarSlotThickness(
	rootRef: RefObject<HTMLElement | null>,
	slotKeys: readonly string[],
) {
	const [thicknessBySlot, setThicknessBySlot] = useState<
		Record<string, number>
	>({});
	const slotKey = slotKeys.join("\0");

	useLayoutEffect(() => {
		const root = rootRef.current;
		if (!root) return;

		const measure = () => {
			const measured: Record<string, number> = {};
			const presentKeys: string[] = [];
			for (const section of root.querySelectorAll<HTMLElement>(
				"[data-toolbar-slot]",
			)) {
				const key = section.dataset.toolbarSlot;
				if (!key) continue;
				presentKeys.push(key);
				const side = key.split(":")[0] as ToolbarSide;
				const size = slotCrossAxisPx(side, section);
				if (size > 0) measured[key] = size;
			}
			setThicknessBySlot((current) => {
				const next = mergeMeasuredSlotThickness(
					current,
					measured,
					presentKeys,
				);
				return sameThickness(current, next) ? current : next;
			});
		};

		measure();
		if (typeof ResizeObserver === "undefined") return;

		// Delivered after layout. Flush so a toolbar that just became visible
		// pushes its neighbor before the browser paints the overlap.
		const observer = new ResizeObserver(() => {
			flushSync(measure);
		});
		for (const section of root.querySelectorAll<HTMLElement>(
			"[data-toolbar-slot]",
		)) {
			observer.observe(section);
		}
		return () => observer.disconnect();
	}, [rootRef, slotKey]);

	return thicknessBySlot;
}
