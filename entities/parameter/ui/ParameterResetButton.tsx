import Icon from "@AppBuilderLib/shared/ui/icon/Icon";
import {ActionIcon} from "@mantine/core";

interface ParameterResetButtonProps {
	onClick: () => void;
	disabled?: boolean;
}

/**
 * Shared reset ActionIcon matching the color parameter's inline refresh button.
 */
export default function ParameterResetButton({
	onClick,
	disabled,
}: ParameterResetButtonProps) {
	return (
		<ActionIcon
			onClick={onClick}
			disabled={disabled}
			style={{flexShrink: 0}}
		>
			<Icon iconType={"tabler:refresh"} />
		</ActionIcon>
	);
}
