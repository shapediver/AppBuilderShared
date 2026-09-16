import {useViewportId} from "@AppBuilderLib/entities/viewport/model/useViewportId";
import {Box} from "@mantine/core";
import {
	CSSProperties,
	MutableRefObject,
	ReactNode,
	useCallback,
	useEffect,
	useMemo,
	useRef,
} from "react";
import type {
	AppBuilderUiEvent,
	IAppBuilderActionSlots,
} from "../config/appbuilderActionSlots";
import {
	actionSlotHandlerKey,
	APP_BUILDER_UI_EVENTS,
	logIgnoredActionSlotEvents,
	pickAllowedActionSlots,
	uiSlotDomProps,
	type AppBuilderUiSlotHandlers,
} from "../lib/appBuilderActionSlots";
import {AppBuilderActionSlotRunner} from "./AppBuilderActionSlotRunner";
import {AppBuilderCustomEventProvider} from "./AppBuilderCustomEventContext";

/**
 * Bind JSON `actionSlots` to `runAppBuilderAction` for UI events.
 *
 * Event *registration* lives here: React pointer/`click` props from
 * `uiSlotDomProps` on a wrap `Box`, or written into `handlersRef` for tab
 * buttons (Mantine forbids wrapping `Tabs.Tab`).
 *
 * Application listeners live in `AppBuilderApplicationActionSlots`. Scene
 * select/hover is host-registered (`interactionSlotListeners`) so this
 * wrapper does not import viewer viewport code.
 *
 * Which slots run is decided via `pickAllowedActionSlots`. Call sites pass
 * a list from `APP_BUILDER_SLOT_EVENTS` (UI kinds share
 * {@link APP_BUILDER_UI_EVENTS} today). Several slots for one event (an
 * array in JSON) each get their own runner and `eventProps` filter.
 *
 * Tabs also call `pickAllowedActionSlots` themselves so `controlProps` only
 * include listeners for slots that will actually run.
 */

export type {AppBuilderUiSlotHandlers};

const LAYOUT_STYLE: Record<"contents" | "block" | "fill", CSSProperties> = {
	contents: {display: "contents"},
	block: {width: "100%"},
	fill: {width: "100%", height: "100%", minHeight: 0, display: "grid"},
};

type Props = {
	actionSlots?: IAppBuilderActionSlots;
	namespace: string;
	/**
	 * Override the default allowlist. Callers pass {@link APP_BUILDER_SLOT_EVENTS}
	 * for the node kind. Defaults to UI events.
	 */
	allowedEvents?: readonly string[];
	/**
	 * Register valid `custom:*` slots (default true). The viewport wrap of
	 * root `actionSlots` sets this false so application listeners own them.
	 */
	includeCustomEvents?: boolean;
	viewportId?: string;
	fullscreenId?: string;
	/**
	 * Wrapper layout. `contents` keeps the node's layout (default) — no visual
	 * change. `block` is used when pointer enter/leave need a hit box.
	 * `fill` is for the viewport host so pointer enter/leave have a box.
	 */
	layout?: "contents" | "block" | "fill";
	/** Skip unsupported-slot warnings (viewport wrap; the application instance already warns). */
	warnUnsupported?: boolean;
	/** When set, write UI triggers here instead of an internal ref (tab controls). */
	handlersRef?: MutableRefObject<AppBuilderUiSlotHandlers>;
	children?: ReactNode;
};

/**
 * Binds UI `actionSlots` to `runAppBuilderAction`.
 *
 * - Default: wrap `children` with pointer/`click` handlers. `display: contents`
 *   does not change layout; hover slots promote to `block` so enter/leave fire.
 * - `handlersRef`: bind UI triggers without wrapping (Mantine tab buttons).
 */
export default function AppBuilderActionSlots({
	actionSlots,
	namespace,
	allowedEvents,
	viewportId: inputViewportId,
	fullscreenId,
	includeCustomEvents = true,
	layout = "contents",
	warnUnsupported = true,
	handlersRef: externalHandlersRef,
	children,
}: Props) {
	const {viewportId: defaultViewportId} = useViewportId();
	const viewportId = inputViewportId ?? defaultViewportId;
	const resolvedAllowedEvents = allowedEvents ?? APP_BUILDER_UI_EVENTS;
	const internalHandlersRef = useRef<AppBuilderUiSlotHandlers>({});
	const handlersRef = externalHandlersRef ?? internalHandlersRef;

	const resolved = useMemo(
		() =>
			pickAllowedActionSlots(actionSlots, resolvedAllowedEvents, {
				includeCustomEvents,
			}),
		[actionSlots, includeCustomEvents, resolvedAllowedEvents],
	);
	const eventNames = useMemo(
		() => new Set(resolved.map((item) => item.eventName)),
		[resolved],
	);
	const resolvedLayout =
		layout === "contents" &&
		(eventNames.has("pointerenter") || eventNames.has("pointerleave"))
			? "block"
			: layout;

	const run = useCallback(
		(eventName: AppBuilderUiEvent) => {
			const map = handlersRef.current as Record<
				string,
				(() => void) | undefined
			>;
			for (const item of resolved) {
				if (item.eventName !== eventName) continue;
				map[actionSlotHandlerKey(item.eventName, item.index)]?.();
			}
		},
		[handlersRef, resolved],
	);

	useEffect(() => {
		if (!warnUnsupported) return;
		logIgnoredActionSlotEvents(
			actionSlots,
			resolvedAllowedEvents,
			"on this node",
		);
	}, [actionSlots, resolvedAllowedEvents, warnUnsupported]);

	const runners = (
		<>
			{resolved.map(({eventName, slot, index}) => (
				<AppBuilderActionSlotRunner
					key={actionSlotHandlerKey(eventName, index)}
					definition={slot.action}
					namespace={namespace}
					viewportId={viewportId}
					fullscreenId={fullscreenId}
					eventName={eventName}
					registerTrigger={(trigger) => {
						const map = handlersRef.current as Record<
							string,
							(() => void) | undefined
						>;
						const key = actionSlotHandlerKey(eventName, index);
						map[key] = () => {
							void trigger();
						};
						map[eventName] = () => {
							for (const item of resolved) {
								if (item.eventName !== eventName) continue;
								map[
									actionSlotHandlerKey(
										item.eventName,
										item.index,
									)
								]?.();
							}
						};
					}}
				/>
			))}
		</>
	);

	if (externalHandlersRef || resolved.length === 0) {
		return (
			<>
				{runners}
				<AppBuilderCustomEventProvider
					namespace={namespace}
					resolved={resolved}
					handlersRef={handlersRef}
				>
					{children}
				</AppBuilderCustomEventProvider>
			</>
		);
	}

	return (
		<>
			{runners}
			<AppBuilderCustomEventProvider
				namespace={namespace}
				resolved={resolved}
				handlersRef={handlersRef}
			>
				<Box
					style={LAYOUT_STYLE[resolvedLayout]}
					{...uiSlotDomProps(run, eventNames)}
				>
					{children}
				</Box>
			</AppBuilderCustomEventProvider>
		</>
	);
}
