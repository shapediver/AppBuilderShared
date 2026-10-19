/**
 * @jest-environment jsdom
 */
import {renderHook} from "@testing-library/react";
import {
	clearPendingSelection,
	hasOtherPendingSelectionInScope,
	markPendingSelection,
	resetPendingSelectionRegistry,
	usePendingSelectionRegistry,
} from "../usePendingSelectionRegistry";

afterEach(() => resetPendingSelectionRegistry());

describe("hasOtherPendingSelectionInScope", () => {
	it("ignores leftover registry keys that have no mounted instance", () => {
		markPendingSelection("unmounted-owner", "namespace-viewport");

		expect(
			hasOtherPendingSelectionInScope(
				"always-active-1-1",
				"namespace-viewport",
			),
		).toBe(false);
	});

	it("clears a leftover key so it cannot block later automatic commits", () => {
		markPendingSelection("unmounted-owner", "namespace-viewport");
		clearPendingSelection("unmounted-owner");

		expect(
			hasOtherPendingSelectionInScope(
				"always-active-1-1",
				"namespace-viewport",
			),
		).toBe(false);
	});
});

describe("usePendingSelectionRegistry", () => {
	it("treats a mounted sibling with a pending draft as pending", () => {
		renderHook(() =>
			usePendingSelectionRegistry("owner-a", "namespace-viewport", true),
		);
		const {result} = renderHook(() =>
			usePendingSelectionRegistry("owner-b", "namespace-viewport", false),
		);

		expect(result.current).toBe(true);
	});
});
