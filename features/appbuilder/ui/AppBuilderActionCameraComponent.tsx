import {useAppBuilderActionCamera} from "@AppBuilderLib/features/appbuilder/model/useAppBuilderActionCamera";
import {IAppBuilderActionPropsCamera} from "../config/appbuilder";
import AppBuilderActionBase, {
	AppBuilderActionRenderProps,
} from "./AppBuilderActionBase";

type Props = IAppBuilderActionPropsCamera &
	AppBuilderActionRenderProps & {
		namespace: string;
		viewportId?: string;
	};

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
	} = props;
	const {
		trigger,
		disabled: resolvedDisabled,
		loading,
		label,
	} = useAppBuilderActionCamera(props);

	return (
		<AppBuilderActionBase
			presentation={presentation}
			label={label}
			icon={icon}
			tooltip={tooltip}
			onClick={() => void trigger()}
			loading={loading}
			disabled={resolvedDisabled}
			canBeDisabledByParameter={false}
			toolbarButtonProps={toolbarButtonProps}
		/>
	);
}
