import {useHasPendingParameterChanges} from "@AppBuilderLib/entities/parameter/model/useHasPendingParameterChanges";
import {useViewportId} from "@AppBuilderLib/entities/viewport/model/useViewportId";
import {ComponentContext} from "@AppBuilderLib/features/appbuilder/config/ComponentContext";
import {runAppBuilderActions} from "@AppBuilderLib/features/appbuilder/model/runAppBuilderAction";
import {
	consumeActionClickExclusivity,
	releaseActionClickTriggers,
	useActionClickSourceStore,
} from "@AppBuilderLib/features/appbuilder/model/useActionClickSourceStore";
import {Logger} from "@AppBuilderLib/shared/lib/logger";
import {useCallback, useContext, useRef, useState} from "react";
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
	const clickTokenRef = useRef<number | null>(null);
	const [loading, setLoading] = useState(false);
	// React clears a ref before effect cleanup, so release from the callback.
	const setButtonRef = useCallback((node: HTMLButtonElement | null) => {
		if (node) {
			if (buttonRef.current && buttonRef.current !== node) {
				releaseActionClickTriggers(buttonRef.current);
			}
			buttonRef.current = node;
			return;
		}
		releaseActionClickTriggers(buttonRef.current);
		buttonRef.current = null;
	}, []);
	const onClick = () => {
		if (resolvedDisabled || runningRef.current) return;
		const element = buttonRef.current;
		const exclusivity = consumeActionClickExclusivity();
		if (element && exclusivity) {
			clickTokenRef.current = useActionClickSourceStore
				.getState()
				.beginActionClick({
					element,
					exclusiveContainers: exclusivity.exclusiveContainers,
					siblingAnchorIds: exclusivity.siblingAnchorIds,
					actions,
				});
		}
		runningRef.current = true;
		setLoading(true);
		void runAppBuilderActions(actions, mode, {
			namespace,
			viewportId,
			fullscreenId,
			hostActions,
		})
			.catch((e) => {
				Logger.warn("executeActions failed:", e);
			})
			.finally(() => {
				if (clickTokenRef.current != null) {
					useActionClickSourceStore
						.getState()
						.endActionClick(clickTokenRef.current);
					clickTokenRef.current = null;
				}
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
