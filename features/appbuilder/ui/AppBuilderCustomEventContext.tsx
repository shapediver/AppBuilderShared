import {createContext, useContext} from "react";
import {dispatchAppBuilderCustomEvent} from "../lib/appBuilderActionSlots";

/**
 * Per-node dispatcher for `custom:*` slots. Provided by
 * {@link AppBuilderActionSlots} around that node's children so a custom
 * widget fires only its own slots, not every other node with the same name.
 *
 * {@link dispatchAppBuilderCustomEvent} stays for root / application slots
 * (and nodes that cannot wrap children, e.g. tab controls).
 */
export const AppBuilderCustomEventContext = createContext<
	((eventName: string) => void) | null
>(null);

/** Dispatch `custom:*` on the nearest action-slot node, else application/root. */
export function useDispatchAppBuilderCustomEvent(): (
	eventName: string,
) => void {
	const local = useContext(AppBuilderCustomEventContext);
	return local ?? dispatchAppBuilderCustomEvent;
}
