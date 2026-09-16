import {useViewportId} from "@AppBuilderLib/entities/viewport/model/useViewportId";
import {ComponentContext} from "@AppBuilderLib/features/appbuilder/config/ComponentContext";
import type {AppBuilderActionRunContext} from "@AppBuilderLib/features/appbuilder/config/appBuilderActionRun";
import {runAppBuilderAction} from "@AppBuilderLib/features/appbuilder/model/runAppBuilderAction";
import {Logger} from "@AppBuilderLib/shared/lib/logger";
import {useContext, useEffect, useRef} from "react";
import type {IAppBuilderActionDefinition} from "../config/appbuilder";
import {
	isAppBuilderCustomEvent,
	registerAppBuilderCustomActionSlot,
} from "../lib/appBuilderActionSlots";

/**
 * One runner per allowed slot. Hooks cannot run in a dynamic loop, so this
 * is a component. It writes a trigger into `registerTrigger`; it does not
 * attach listeners itself. Valid `custom:*` names also register with
 * {@link registerAppBuilderCustomActionSlot}.
 */
export function AppBuilderActionSlotRunner({
	definition,
	namespace,
	viewportId,
	fullscreenId,
	eventName,
	registerCustomGlobally = false,
	registerTrigger,
}: {
	definition: IAppBuilderActionDefinition;
	namespace: string;
	viewportId?: string;
	fullscreenId?: string;
	eventName?: string;
	/** When true, register `custom:*` on the application bus (root / tab slots). */
	registerCustomGlobally?: boolean;
	registerTrigger: (trigger: () => void | Promise<void>) => void;
}) {
	const {actions: hostActions} = useContext(ComponentContext);
	const {viewportId: defaultViewportId} = useViewportId();
	const resolvedViewportId = viewportId ?? defaultViewportId;

	const contextRef = useRef<AppBuilderActionRunContext>({
		namespace,
		viewportId: resolvedViewportId,
		fullscreenId,
		hostActions,
	});
	contextRef.current = {
		namespace,
		viewportId: resolvedViewportId,
		fullscreenId,
		hostActions,
	};

	const definitionRef = useRef(definition);
	definitionRef.current = definition;

	const runCurrent = () =>
		runAppBuilderAction(definitionRef.current, contextRef.current).catch(
			(error) => {
				Logger.warn("Action slot failed:", error);
			},
		);

	registerTrigger(runCurrent);

	useEffect(() => {
		if (!registerCustomGlobally) return;
		if (!eventName || !isAppBuilderCustomEvent(eventName)) return;
		return registerAppBuilderCustomActionSlot(
			eventName,
			() =>
				runAppBuilderAction(
					definitionRef.current,
					contextRef.current,
				).catch((error) => {
					Logger.warn("Action slot failed:", error);
				}),
			namespace,
		);
	}, [eventName, namespace, registerCustomGlobally]);

	return null;
}
