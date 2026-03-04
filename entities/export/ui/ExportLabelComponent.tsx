import {useNotificationStore} from "@AppBuilderLib/features/notifications";
import {TooltipWrapper} from "@AppBuilderLib/shared/ui/tooltip";
import TextWeighted from "@AppBuilderShared/components/ui/TextWeighted";
import {useExport} from "@AppBuilderLib/entities/export/model/useExport";
import {PropsExport} from "@AppBuilderLib/entities/export/config/propsExport";
import {Group, MantineThemeComponent, useProps} from "@mantine/core";
import React from "react";

interface Props extends PropsExport {
	/** Optional label overriding the default label */
	label?: string;
	/** Component to show on the right hand side of the label */
	rightSection?: React.ReactNode;
}

interface StyleProps {
	fontWeight: string;
}

const defaultStyleProps: Partial<StyleProps> = {};

type ExportLabelComponentPropsType = Partial<StyleProps>;

export function ExportLabelComponentThemeProps(
	props: ExportLabelComponentPropsType,
): MantineThemeComponent {
	return {
		defaultProps: props,
	};
}

/**
 * Functional component that creates a label for an export.
 *
 * @returns
 */
export default function ExportLabelComponent(
	props: Props & Partial<StyleProps>,
) {
	const {label, rightSection, ...rest} = props;
	const notifications = useNotificationStore();
	const {definition} = useExport(props) ?? {};

	if (!definition) {
		notifications.error({
			message: `Export ${props.exportId} not found`,
		});
		return <></>;
	}

	const {fontWeight} = useProps(
		"ExportLabelComponent",
		defaultStyleProps,
		rest,
	);
	const {displayname, name, tooltip} = definition;
	const label_ = label || displayname || name;

	const labelcomp = (
		<TextWeighted pb={4} size="sm" fontWeight="medium" fw={fontWeight}>
			{label_}
		</TextWeighted>
	);

	return (
		<Group justify="space-between" w="100%" wrap="nowrap">
			{tooltip ? (
				<TooltipWrapper label={tooltip} position="top">
					{labelcomp}
				</TooltipWrapper>
			) : (
				labelcomp
			)}
			{rightSection}
		</Group>
	);
}
