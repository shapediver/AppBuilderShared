import {useViewportId} from "@AppBuilderLib/entities/viewport/model/useViewportId";
import {ComponentContext} from "@AppBuilderLib/features/appbuilder/config/ComponentContext";
import {runAppBuilderActions} from "@AppBuilderLib/features/appbuilder/model/runAppBuilderAction";
import {Logger} from "@AppBuilderLib/shared/lib/logger";
import {useContext, useRef, useState} from "react";
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
	const runningRef = useRef(false);
	const [loading, setLoading] = useState(false);
	const onClick = () => {
		if (disabled || runningRef.current) return;
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
			disabled={!!disabled || loading}
			toolbarButtonProps={toolbarButtonProps}
		/>
	);
}
