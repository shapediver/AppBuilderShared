import {useHasPendingParameterChanges} from "@AppBuilderLib/entities/parameter/model/useHasPendingParameterChanges";
import {createActionClickHandler} from "@AppBuilderLib/features/appbuilder/lib/createActionClickHandler";
import {runAppBuilderActionCreateModelState} from "@AppBuilderLib/features/appbuilder/model/runAppBuilderActionCreateModelState";
import {useState} from "react";
import {IAppBuilderLegacyActionPropsCreateModelState} from "../config/appbuilder";
import AppBuilderActionBase, {
	AppBuilderActionRenderProps,
} from "./AppBuilderActionBase";

type Props = IAppBuilderLegacyActionPropsCreateModelState &
	AppBuilderActionRenderProps & {
		namespace: string;
	};

/**
 * Functional component for a "createModelState" action.
 *
 * @returns
 */
export default function AppBuilderActionCreateModelStateComponent(
	props: Props,
) {
	const {
		label = "Save configuration",
		icon = "tabler:device-floppy",
		tooltip,
		namespace,
		presentation,
		toolbarButtonProps,
		disabled,
		includeImage,
		image,
		includeGltf,
		screenshotProps,
		parameterNamesToInclude,
		parameterNamesToExclude,
		successMessage,
		errorMessage,
	} = props;
	const [loading, setLoading] = useState(false);
	const hasPendingChanges = useHasPendingParameterChanges(namespace);
	const resolvedDisabled = disabled || hasPendingChanges;
	const onClick = createActionClickHandler(
		() =>
			runAppBuilderActionCreateModelState(
				{
					includeImage,
					image,
					includeGltf,
					screenshotProps,
					parameterNamesToInclude,
					parameterNamesToExclude,
					successMessage,
					errorMessage,
				},
				{namespace},
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
