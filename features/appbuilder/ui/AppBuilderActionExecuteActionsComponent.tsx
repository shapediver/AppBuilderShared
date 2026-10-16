import {useHasPendingParameterChanges} from "@AppBuilderLib/entities/parameter/model/useHasPendingParameterChanges";
import {useViewportId} from "@AppBuilderLib/entities/viewport/model/useViewportId";
import {ComponentContext} from "@AppBuilderLib/features/appbuilder/config/ComponentContext";
import {consumeActionHost} from "@AppBuilderLib/features/appbuilder/model/appBuilderActionHost";
import {runAppBuilderActions} from "@AppBuilderLib/features/appbuilder/model/runAppBuilderAction";
import {setupAppBuilderAction} from "@AppBuilderLib/features/appbuilder/model/setupAppBuilderAction";
import {Logger} from "@AppBuilderLib/shared/lib/logger";
import {useCallback, useContext, useEffect, useRef, useState} from "react";
import {
	IAppBuilderActionPropsCommon,
	IAppBuilderActionPropsExecuteActions,
} from "../config/appbuilder";
import AppBuilderActionBase, {
	AppBuilderActionRenderProps,
} from "./AppBuilderActionBase";

type Props = IAppBuilderActionPropsExecuteActions &
	IAppBuilderActionPropsCommon &
	AppBuilderActionRenderProps & {
		namespace: string;
		viewportId?: string;
		fullscreenId?: string;
	};

/** Executes nested App Builder actions in parallel or in sequence. */
export default function AppBuilderActionExecuteActionsComponent(props: Props) {
	const {
		actions,
		mode = "parallel",
		label = "Run actions",
		icon = "tabler:player-play",
		tooltip,
		presentation,
		toolbarButtonProps,
		disabled,
		namespace,
		viewportId: inputViewportId,
		fullscreenId,
	} = props;
	const {viewportId: defaultViewportId} = useViewportId();
	const viewportId = inputViewportId ?? defaultViewportId;
	const {actions: hostActions} = useContext(ComponentContext);
	const hasPendingChanges = useHasPendingParameterChanges(namespace);
	const resolvedDisabled = !!disabled || hasPendingChanges;
	const runningRef = useRef(false);
	const buttonRef = useRef<HTMLButtonElement | null>(null);
	const cleanupRef = useRef<(() => void) | null>(null);
	const actionsRef = useRef(actions);
	const hostActionsRef = useRef(hostActions);
	actionsRef.current = actions;
	hostActionsRef.current = hostActions;
	const [loading, setLoading] = useState(false);
	// Stable across action-list updates. Detaching the button would clear
	// the panel position and an open panel would jump to the center.
	const setButtonRef = useCallback((node: HTMLButtonElement | null) => {
		if (!node) {
			cleanupRef.current?.();
			cleanupRef.current = null;
		}
		buttonRef.current = node;
	}, []);
	useEffect(() => {
		const element = buttonRef.current;
		if (!element) return;
		const cleanups: Array<() => void> = [];
		for (const action of actionsRef.current) {
			const cleanup = setupAppBuilderAction(
				action,
				{element},
				hostActionsRef.current,
			);
			if (cleanup) cleanups.push(cleanup);
		}
		const previous = cleanupRef.current;
		cleanupRef.current = () => {
			for (const cleanup of cleanups) cleanup();
		};
		previous?.();
	}, [actions]);
	const onClick = () => {
		if (resolvedDisabled || runningRef.current) return;
		const notedHost = consumeActionHost();
		runningRef.current = true;
		setLoading(true);
		void runAppBuilderActions(actions, mode, {
			namespace,
			viewportId,
			fullscreenId,
			hostActions,
			...(notedHost ? {actionHost: {...notedHost, actions}} : {}),
		})
			.catch((e) => {
				Logger.warn("executeActions failed:", e);
			})
			.finally(() => {
				runningRef.current = false;
				setLoading(false);
			});
	};

	return (
		<AppBuilderActionBase
			presentation={presentation}
			label={label}
			icon={icon}
			tooltip={tooltip}
			onClick={onClick}
			loading={loading}
			disabled={resolvedDisabled || loading}
			toolbarButtonProps={toolbarButtonProps}
			buttonRef={setButtonRef}
		/>
	);
}
