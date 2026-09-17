import {Logger} from "@AppBuilderLib/shared/lib/logger";
import {createContext, ReactNode, useCallback, useContext} from "react";
import {
	dispatchAppBuilderCustomEvent,
	isAppBuilderCustomEvent,
	runResolvedCustomSlots,
	type ResolvedActionSlot,
} from "../lib/appBuilderActionSlots";

/**
 * Per-node dispatcher for `custom:*` slots. Provided around that node's
 * children (widgets, containers, tab panels) so a custom widget fires only
 * this node's slots. Misses bubble to the parent node, then to the
 * application/root bus ({@link dispatchAppBuilderCustomEvent}).
 */
export const AppBuilderCustomEventContext = createContext<
	((eventName: string) => void) | null
>(null);

/**
 * Dispatch `custom:*` on this node. Unmatched names bubble to the parent
 * provider, then to application/root slots for `namespace`.
 */
export function AppBuilderCustomEventProvider({
	namespace,
	resolved,
	handlersRef,
	children,
}: {
	namespace: string;
	resolved: readonly ResolvedActionSlot[];
	handlersRef: {current: Record<string, (() => void) | undefined>};
	children?: ReactNode;
}) {
	const parentDispatch = useContext(AppBuilderCustomEventContext);
	const dispatch = useCallback(
		(eventName: string) => {
			if (!isAppBuilderCustomEvent(eventName)) {
				Logger.warn(
					`"${eventName}" is not a custom action slot event (expected custom:kebab-case).`,
				);
				return;
			}
			if (
				runResolvedCustomSlots(handlersRef.current, resolved, eventName)
			) {
				return;
			}
			if (parentDispatch) {
				parentDispatch(eventName);
				return;
			}
			dispatchAppBuilderCustomEvent(eventName, namespace);
		},
		[handlersRef, namespace, parentDispatch, resolved],
	);

	return (
		<AppBuilderCustomEventContext.Provider value={dispatch}>
			{children}
		</AppBuilderCustomEventContext.Provider>
	);
}

/** Dispatch `custom:*` on the nearest action-slot node, else application/root. */
export function useDispatchAppBuilderCustomEvent(): (
	eventName: string,
) => void {
	const local = useContext(AppBuilderCustomEventContext);
	return local ?? dispatchAppBuilderCustomEvent;
}
