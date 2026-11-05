import {
	addParameterComputationListener,
	type ParameterComputationEventType,
} from "@AppBuilderLib/entities/parameter/model/parameterComputationEvents";
import {useViewportId} from "@AppBuilderLib/entities/viewport/model/useViewportId";
import {MutableRefObject, useEffect, useMemo, useRef} from "react";
import type {
	AppBuilderParameterComputationEvent,
	IAppBuilderParameterControlActionSlots,
} from "../config/appbuilderActionSlots";
import {
	actionSlotHandlerKey,
	pickParameterComputationSlots,
	type ResolvedActionSlot,
} from "../lib/appBuilderActionSlots";
import {AppBuilderActionSlotRunner} from "./AppBuilderActionSlotRunner";

const COMPUTATION_EVENT_TYPE: Record<
	AppBuilderParameterComputationEvent,
	ParameterComputationEventType
> = {
	computationstart: "start",
	computationend: "end",
	computationerror: "error",
};

function runItems(
	handlersRef: MutableRefObject<Record<string, (() => void) | undefined>>,
	items: ResolvedActionSlot[],
	eventName: AppBuilderParameterComputationEvent,
) {
	for (const item of items) {
		if (item.eventName !== eventName) continue;
		handlersRef.current[
			actionSlotHandlerKey(item.eventName, item.index)
		]?.();
	}
}

type Props = {
	/** The `computationstart`, `computationend`, and `computationerror` slots of the control. */
	actionSlots?: IAppBuilderParameterControlActionSlots;
	/** Namespace the actions run in (the namespace of the widget that owns the control). */
	namespace: string;
	/** Id of the session the parameter of the control belongs to. */
	sessionId: string;
	/** Id of the parameter of the control, as used by the session. */
	parameterId: string;
	viewportId?: string;
	fullscreenId?: string;
};

/**
 * Runs the computation slots of a parameter control: `computationstart`,
 * `computationend`, and `computationerror`.
 *
 * Same events as the root (see {@link AppBuilderApplicationActionSlots}), but
 * a slot runs only when the customization included the parameter of the
 * control. The ids the customization sends come from the parameter executor
 * (`parameterComputationEvents`), because the viewer task carries only the
 * session id. The slots take no `eventProps` and the action stays static.
 *
 * Kept next to the controls, not in the DOM wrapper
 * ({@link AppBuilderActionSlots}), which only handles UI events.
 */
export default function AppBuilderParameterActionSlots({
	actionSlots,
	namespace,
	sessionId,
	parameterId,
	viewportId: inputViewportId,
	fullscreenId,
}: Props) {
	const {viewportId: defaultViewportId} = useViewportId();
	const viewportId = inputViewportId ?? defaultViewportId;
	const handlersRef = useRef<Record<string, (() => void) | undefined>>({});
	const resolved = useMemo(
		() => pickParameterComputationSlots(actionSlots),
		[actionSlots],
	);

	useEffect(() => {
		const removers = (
			Object.keys(
				COMPUTATION_EVENT_TYPE,
			) as AppBuilderParameterComputationEvent[]
		)
			.filter((eventName) =>
				resolved.some((item) => item.eventName === eventName),
			)
			.map((eventName) =>
				addParameterComputationListener(
					COMPUTATION_EVENT_TYPE[eventName],
					(event) => {
						if (event.sessionId !== sessionId) return;
						if (!event.parameterIds.includes(parameterId)) return;
						runItems(handlersRef, resolved, eventName);
					},
				),
			);
		return () => {
			removers.forEach((remove) => remove());
		};
	}, [parameterId, resolved, sessionId]);

	return (
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
						handlersRef.current[
							actionSlotHandlerKey(eventName, index)
						] = () => {
							void trigger();
						};
					}}
				/>
			))}
		</>
	);
}
