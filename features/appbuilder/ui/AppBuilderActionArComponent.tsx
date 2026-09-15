import {useHasPendingParameterChanges} from "@AppBuilderLib/entities/parameter/model/useHasPendingParameterChanges";
import {useShapeDiverStoreViewport} from "@AppBuilderLib/entities/viewport/model/useShapeDiverStoreViewport";
import {useViewportId} from "@AppBuilderLib/entities/viewport/model/useViewportId";
import {createActionClickHandler} from "@AppBuilderLib/features/appbuilder/lib/createActionClickHandler";
import {runAppBuilderActionAr} from "@AppBuilderLib/features/appbuilder/model/runAppBuilderActionAr";
import {useState} from "react";
import {
	AppBuilderActionType,
	IAppBuilderActionPropsAr,
	IAppBuilderActionPropsCommon,
} from "../config/appbuilder";
import AppBuilderActionBase, {
	AppBuilderActionRenderProps,
} from "./AppBuilderActionBase";

type Props = IAppBuilderActionPropsAr &
	IAppBuilderActionPropsCommon &
	AppBuilderActionRenderProps & {
		namespace: string;
		viewportId?: string;
	};

export default function AppBuilderActionArComponent(props: Props) {
	const {
		label = "View in AR",
		icon = "tabler:augmented-reality",
		tooltip,
		namespace,
		presentation,
		viewportId,
		toolbarButtonProps,
		disabled,
	} = props;
	const [loading, setLoading] = useState(false);
	const {viewportId: defaultViewportId} = useViewportId();
	const actionViewportId = viewportId ?? defaultViewportId;
	const hasPendingChanges = useHasPendingParameterChanges(namespace);
	const viewportApi = useShapeDiverStoreViewport(
		(state) => state.viewports[actionViewportId],
	);
	const resolvedDisabled = disabled || hasPendingChanges || !viewportApi;
	const onClick = createActionClickHandler(
		() =>
			runAppBuilderActionAr(
				{
					type: AppBuilderActionType.Ar,
					props: {viewportId: actionViewportId},
				},
				{namespace, viewportId: actionViewportId},
			),
		{disabled: resolvedDisabled, setLoading},
	);

	return (
		<AppBuilderActionBase
			presentation={presentation}
			label={label}
			icon={icon}
			tooltip={tooltip}
			onClick={onClick}
			loading={loading}
			disabled={resolvedDisabled}
			toolbarButtonProps={toolbarButtonProps}
		/>
	);
}
