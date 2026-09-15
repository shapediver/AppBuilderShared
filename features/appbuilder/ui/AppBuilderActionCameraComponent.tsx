import {useShapeDiverStoreViewport} from "@AppBuilderLib/entities/viewport/model/useShapeDiverStoreViewport";
import {useViewportId} from "@AppBuilderLib/entities/viewport/model/useViewportId";
import {createActionClickHandler} from "@AppBuilderLib/features/appbuilder/lib/createActionClickHandler";
import {runAppBuilderActionCamera} from "@AppBuilderLib/features/appbuilder/model/runAppBuilderActionCamera";
import {useMemo, useState} from "react";
import {
	AppBuilderActionType,
	IAppBuilderActionPropsCamera,
	isAnimateCameraAction,
	isAssignCameraAction,
	isResetCameraAction,
	isSetCameraAction,
	isZoomToCameraAction,
} from "../config/appbuilder";
import AppBuilderActionBase, {
	AppBuilderActionRenderProps,
} from "./AppBuilderActionBase";

type Props = IAppBuilderActionPropsCamera &
	AppBuilderActionRenderProps & {
		namespace: string;
		viewportId?: string;
	};

function cameraActionLabel(props: IAppBuilderActionPropsCamera): string {
	if (props.label !== undefined) return props.label;
	if (isAnimateCameraAction(props)) return "Animate camera";
	if (isAssignCameraAction(props)) return "Assign camera";
	if (isSetCameraAction(props)) return "Set camera";
	if (isResetCameraAction(props)) return "Reset camera";
	if (isZoomToCameraAction(props)) return "Zoom extents";
	return "Start camera";
}

/**
 * Functional component for a "camera" action.
 *
 * @returns
 */
export default function AppBuilderActionCameraComponent(props: Props) {
	const {
		icon = "tabler:video",
		tooltip,
		presentation,
		toolbarButtonProps,
		namespace,
		viewportId,
		disabled,
	} = props;
	const {viewportId: defaultViewportId} = useViewportId();
	const resolvedViewportId = viewportId ?? defaultViewportId;
	const viewportApi = useShapeDiverStoreViewport(
		(state) => state.viewports[resolvedViewportId],
	);
	const [loading, setLoading] = useState(false);
	const label = useMemo(() => cameraActionLabel(props), [props]);
	const onClick = createActionClickHandler(
		() =>
			runAppBuilderActionCamera(
				{type: AppBuilderActionType.Camera, props},
				{namespace, viewportId: resolvedViewportId},
			),
		{
			disabled: disabled || !viewportApi?.camera,
			setLoading,
		},
	);

	return (
		<AppBuilderActionBase
			presentation={presentation}
			label={label}
			icon={icon}
			tooltip={tooltip}
			onClick={onClick}
			loading={loading}
			disabled={disabled || !viewportApi}
			canBeDisabledByParameter={false}
			toolbarButtonProps={toolbarButtonProps}
		/>
	);
}
