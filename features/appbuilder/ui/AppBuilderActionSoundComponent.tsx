import {useAppBuilderActionSound} from "@AppBuilderLib/features/appbuilder/model/useAppBuilderActionSound";
import {IAppBuilderLegacyActionPropsSound} from "../config/appbuilder";
import AppBuilderActionBase, {
	AppBuilderActionRenderProps,
} from "./AppBuilderActionBase";

type Props = IAppBuilderLegacyActionPropsSound &
	AppBuilderActionRenderProps & {};

/**
 * Functional component for a "sound" action.
 *
 * @returns
 */
export default function AppBuilderActionSoundComponent(props: Props) {
	const {
		label = "Play sound",
		icon,
		labelPlaying = "Stop sound",
		iconPlaying,
		tooltip,
		href,
		autoplay = false,
		loop = false,
		presentation,
		toolbarButtonProps,
		disabled,
	} = props;
	const {
		trigger,
		disabled: resolvedDisabled,
		playing,
		error,
	} = useAppBuilderActionSound({href, autoplay, loop, disabled});

	return (
		<AppBuilderActionBase
			presentation={presentation}
			label={playing ? labelPlaying : label}
			icon={playing ? iconPlaying : icon}
			tooltip={error ? `Error: ${error}` : tooltip}
			onClick={trigger}
			disabled={resolvedDisabled}
			canBeDisabledByParameter={false}
			toolbarButtonProps={toolbarButtonProps}
		/>
	);
}
