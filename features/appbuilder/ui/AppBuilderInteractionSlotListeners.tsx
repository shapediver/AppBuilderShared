import {useSelection} from "@AppBuilderLib/entities/parameter/model/interaction/useSelection";
import {useShapeDiverStoreInteractionRequestManagement} from "@AppBuilderLib/entities/parameter/model/useShapeDiverStoreInteractionRequestManagement";
import type {AppBuilderInteractionSlotListenersProps} from "@AppBuilderLib/features/appbuilder/config/ComponentContext.types";
import {Logger} from "@AppBuilderLib/shared/lib/logger";
import {useShapeDiverStoreProcessManager} from "@AppBuilderLib/shared/model/useShapeDiverStoreProcessManager";
import {
	addListener,
	EVENTTYPE_INTERACTION,
	removeListener,
	type IEvent,
} from "@shapediver/viewer.session";
import type {ISelectionParameterProps} from "@shapediver/viewer.shared.types";
import {
	MutableRefObject,
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import type {
	IAppBuilderActionSlot,
	IAppBuilderActionSlotEventPropsSelection,
} from "../config/appbuilderActionSlots";
import {
	actionSlotHandlerKey,
	getActionSlotEventProps,
	isAppBuilderInteractionEvent,
	mapViewerInteractionEventToSlot,
	selectionSlotGroupKey,
	selectionSlotNameFilterKey,
	type ResolvedActionSlot,
} from "../lib/appBuilderActionSlots";

const selectedNodeNamesCache: {[key: string]: string[]} = {};

/** Viewer events that drive `selecton` / `selectoff` / `hoveron` / `hoveroff`. */
const VIEWER_INTERACTION_EVENTS = [
	EVENTTYPE_INTERACTION.SELECT_ON,
	EVENTTYPE_INTERACTION.SELECT_OFF,
	EVENTTYPE_INTERACTION.MULTI_SELECT_ON,
	EVENTTYPE_INTERACTION.MULTI_SELECT_OFF,
	EVENTTYPE_INTERACTION.HOVER_ON,
	EVENTTYPE_INTERACTION.HOVER_OFF,
] as const;

function getAllAvailableNames(availableNodeNames: {
	[key: string]: {[key: string]: string[]};
}) {
	return Object.values(availableNodeNames).flatMap((perOutput) =>
		Object.values(perOutput).flat(),
	);
}

function getValidCachedNames(
	cachedNames: string[] | undefined,
	availableNodeNames: {[key: string]: {[key: string]: string[]}},
) {
	if (!cachedNames || cachedNames.length === 0) return [];
	const availableNames = getAllAvailableNames(availableNodeNames);
	if (availableNames.length === 0) return cachedNames;
	return cachedNames.filter((name) => availableNames.includes(name));
}

function sameNameSet(a: string[], b: string[]): boolean {
	if (a.length !== b.length) return false;
	const names = new Set(a);
	return b.every((name) => names.has(name));
}

function selectionEventProps(
	slot: IAppBuilderActionSlot,
): IAppBuilderActionSlotEventPropsSelection | undefined {
	return getActionSlotEventProps(slot, "selection") as
		| IAppBuilderActionSlotEventPropsSelection
		| undefined;
}

function runSlot(
	handlersRef: MutableRefObject<Record<string, (() => void) | undefined>>,
	item: ResolvedActionSlot,
): void {
	handlersRef.current[actionSlotHandlerKey(item.eventName, item.index)]?.();
}

/**
 * First defined visual / filter field across every slot in a group. Groups
 * share a full effective config, so this is usually a no-op merge.
 */
function mergeSelectionEventProps(
	items: ResolvedActionSlot[],
): IAppBuilderActionSlotEventPropsSelection {
	const merged: IAppBuilderActionSlotEventPropsSelection = {};
	for (const item of items) {
		const eventProps = selectionEventProps(item.slot);
		if (!eventProps) continue;
		const keys = Object.keys(eventProps) as Array<
			keyof IAppBuilderActionSlotEventPropsSelection
		>;
		for (const key of keys) {
			if (merged[key] === undefined && eventProps[key] !== undefined) {
				Object.assign(merged, {[key]: eventProps[key]});
			}
		}
	}
	return merged;
}

type InteractionViewerEvent = IEvent & {
	event?: PointerEvent;
	reselection?: boolean;
	viewportId?: string;
	manager?: {id: string};
};

/**
 * One `useSelection` per distinct effective selection config, like an
 * anchor's `selectionProperties`. Passive so a selection parameter can take
 * over. Slot names are `selecton` / `selectoff` / `hoveron` / `hoveroff`.
 * Viewer multi-select on/off is mapped onto `selecton` / `selectoff`.
 */
function InteractionSlotGroup({
	items,
	namespace,
	viewportId,
	handlersRef,
}: {
	items: ResolvedActionSlot[];
	namespace: string;
	viewportId: string;
	handlersRef: MutableRefObject<Record<string, (() => void) | undefined>>;
}) {
	const mergedEventProps = useMemo(
		() => mergeSelectionEventProps(items),
		[items],
	);
	const resolvedViewportId = mergedEventProps.viewportId ?? viewportId;
	const nameFilter = mergedEventProps.nameFilter?.length
		? mergedEventProps.nameFilter
		: ["*"];
	const cacheKey = selectionSlotGroupKey(mergedEventProps, viewportId);
	const [selectionAllowed, setSelectionAllowed] = useState(true);
	const interactionRequestTokenRef = useRef<string | undefined>(undefined);
	const restoringRef = useRef(false);
	const lastEmittedNamesRef = useRef<string[]>([]);
	const {addInteractionRequest, removeInteractionRequest} =
		useShapeDiverStoreInteractionRequestManagement();
	const processActive = useShapeDiverStoreProcessManager((state) =>
		Object.values(state.processManagers).some(
			(manager) => manager.controllerSessionId === namespace,
		),
	);
	const processActiveRef = useRef(processActive);
	processActiveRef.current = processActive;
	const selectionAllowedRef = useRef(selectionAllowed);
	selectionAllowedRef.current = selectionAllowed;

	useEffect(() => {
		if (!interactionRequestTokenRef.current) {
			interactionRequestTokenRef.current = addInteractionRequest({
				type: "passive",
				viewportId: resolvedViewportId,
				disable: () => {
					setSelectionAllowed(false);
				},
				enable: () => {
					setSelectionAllowed(true);
				},
			});
		}
		return () => {
			if (interactionRequestTokenRef.current) {
				removeInteractionRequest(interactionRequestTokenRef.current);
				interactionRequestTokenRef.current = undefined;
			}
		};
	}, [addInteractionRequest, removeInteractionRequest, resolvedViewportId]);

	const selectionProps = useMemo((): ISelectionParameterProps => {
		const {
			viewportId: _viewportId,
			minimumSelection,
			maximumSelection,
			hover,
			...rest
		} = mergedEventProps;
		return {
			...rest,
			nameFilter,
			minimumSelection: minimumSelection ?? 0,
			maximumSelection: maximumSelection ?? 1,
			deselectOnEmpty: true,
			hover: hover !== false,
		};
	}, [mergedEventProps, nameFilter]);

	const {
		selectedNodeNames,
		availableNodeNames,
		setSelectedNodeNamesAndRestoreSelection,
		componentId,
	} = useSelection(
		resolvedViewportId,
		selectionProps,
		selectionAllowed,
		selectedNodeNamesCache[cacheKey] || [],
	);

	const itemsRef = useRef(items);
	itemsRef.current = items;

	const fireNamed = useCallback(
		(eventName: string) => {
			for (const item of itemsRef.current) {
				if (item.eventName === eventName) runSlot(handlersRef, item);
			}
		},
		[handlersRef],
	);

	useEffect(() => {
		const tokens = VIEWER_INTERACTION_EVENTS.map((eventType) =>
			addListener(eventType, (event: IEvent) => {
				const interactionEvent = event as InteractionViewerEvent;
				if (interactionEvent.manager?.id !== componentId) return;
				if (!selectionAllowedRef.current) return;
				if (processActiveRef.current) return;
				if (restoringRef.current) return;
				if (
					interactionEvent.viewportId &&
					interactionEvent.viewportId !== resolvedViewportId
				) {
					return;
				}
				if (!interactionEvent.event) return;
				const slotName = mapViewerInteractionEventToSlot(
					eventType,
					interactionEvent,
				);
				if (!slotName) return;
				fireNamed(slotName);
			}),
		);
		return () => {
			tokens.forEach((token) => removeListener(token));
		};
	}, [componentId, fireNamed, handlersRef, resolvedViewportId]);

	useEffect(() => {
		if (selectedNodeNames.length > 0) {
			selectedNodeNamesCache[cacheKey] = selectedNodeNames;
		} else {
			const hasAvailableNames =
				getAllAvailableNames(availableNodeNames).length > 0;
			if (!processActive && hasAvailableNames) {
				selectedNodeNamesCache[cacheKey] = [];
			}
		}
	}, [availableNodeNames, cacheKey, processActive, selectedNodeNames]);

	useEffect(() => {
		if (processActive || restoringRef.current) return;
		lastEmittedNamesRef.current = selectedNodeNames;
	}, [processActive, selectedNodeNames]);

	const prevProcessActiveRef = useRef(processActive);
	useEffect(() => {
		const wasActive = prevProcessActiveRef.current;
		prevProcessActiveRef.current = processActive;
		if (!wasActive || processActive) return;
		const validCachedNames = getValidCachedNames(
			selectedNodeNamesCache[cacheKey],
			availableNodeNames,
		);
		selectedNodeNamesCache[cacheKey] = validCachedNames;
		const selectionChanged = !sameNameSet(
			lastEmittedNamesRef.current,
			validCachedNames,
		);
		restoringRef.current = true;
		if (validCachedNames.length > 0) {
			setSelectedNodeNamesAndRestoreSelection(validCachedNames);
		}
		lastEmittedNamesRef.current = validCachedNames;
		if (selectionChanged) {
			if (validCachedNames.length > 0) fireNamed("selecton");
			else fireNamed("selectoff");
		}
		queueMicrotask(() => {
			restoringRef.current = false;
		});
	}, [
		availableNodeNames,
		cacheKey,
		fireNamed,
		processActive,
		setSelectedNodeNamesAndRestoreSelection,
	]);

	useEffect(() => {
		return () => {
			delete selectedNodeNamesCache[cacheKey];
		};
	}, [cacheKey]);

	return null;
}

/**
 * ShapeDiver host implementation of `interactionSlotListeners`. Registered
 * from `AppBuilderRoot` — do not import this from shared application-slot
 * wiring (that would pull `useSelection` / `viewer.viewport` into iJewel).
 *
 * Enables scene-node hover/select for root interaction slots and runs the
 * matching `selecton` / `selectoff` / `hoveron` / `hoveroff` slot. Viewer
 * multi-select events are mapped onto the select slots.
 */
export function AppBuilderInteractionSlotListeners({
	resolved,
	namespace,
	viewportId,
	handlersRef,
}: AppBuilderInteractionSlotListenersProps) {
	const items = useMemo(
		() =>
			resolved.filter((item) =>
				isAppBuilderInteractionEvent(item.eventName),
			),
		[resolved],
	);
	const groups = useMemo(() => {
		const map = new Map<string, ResolvedActionSlot[]>();
		const filterToGroupKeys = new Map<string, Set<string>>();
		const warnedFilterKeys = new Set<string>();
		for (const item of items) {
			const eventProps = selectionEventProps(item.slot);
			const key = selectionSlotGroupKey(eventProps, viewportId);
			const filterKey = selectionSlotNameFilterKey(
				eventProps,
				viewportId,
			);
			let groupKeys = filterToGroupKeys.get(filterKey);
			if (!groupKeys) {
				groupKeys = new Set();
				filterToGroupKeys.set(filterKey, groupKeys);
			}
			if (
				groupKeys.size > 0 &&
				!groupKeys.has(key) &&
				!warnedFilterKeys.has(filterKey)
			) {
				Logger.warn(
					"Action slots share a nameFilter and viewport but differ in selection config (colors, max, hover, occlusion) and will run as separate interaction groups.",
				);
				warnedFilterKeys.add(filterKey);
			}
			groupKeys.add(key);
			const group = map.get(key);
			if (group) group.push(item);
			else map.set(key, [item]);
		}
		return [...map.entries()];
	}, [items, viewportId]);

	if (items.length === 0) return null;
	return (
		<>
			{groups.map(([key, groupItems]) => (
				<InteractionSlotGroup
					key={key}
					items={groupItems}
					namespace={namespace}
					viewportId={viewportId}
					handlersRef={handlersRef}
				/>
			))}
		</>
	);
}
