import ModelStateNotificationCreated from "@AppBuilderShared/components/shapediver/modelState/ModelStateNotificationCreated";
import ImportModelStateDialog from "@AppBuilderShared/components/shapediver/ui/ImportModelStateDialog";
import {NotificationContext} from "@AppBuilderShared/context/NotificationContext";
import {useParameterImportExport} from "@AppBuilderShared/hooks/shapediver/parameters/useParameterImportExport";
import {useCreateModelState} from "@AppBuilderShared/hooks/shapediver/useCreateModelState";
import {ViewportTransparentBackgroundStyle} from "@AppBuilderShared/types/shapediver/viewport";
import {MenuDropdownProps} from "@mantine/core";
import React, {useCallback, useContext, useMemo, useState} from "react";
import {CommonButtonProps, IconProps} from "./types";
import ViewportIconButtonDropdown from "./ViewportIconButtonDropdown";

interface HistoryMenuButtonProps extends CommonButtonProps {
	disabled: boolean;
	namespace: string;
	menuDropdownProps?: MenuDropdownProps;
	visible?: boolean;
}

export default function HistoryMenuButton({
	disabled,
	namespace,
	size = undefined,
	color = IconProps.color,
	colorDisabled = IconProps.colorDisabled,
	variant = IconProps.variant,
	variantDisabled = IconProps.variantDisabled,
	iconStyle = IconProps.style,
	menuDropdownProps = {
		style: ViewportTransparentBackgroundStyle,
	},
	visible = true,
}: HistoryMenuButtonProps) {
	const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
	const [isCreatingModelState, setIsCreatingModelState] = useState(false);

	const notifications = useContext(NotificationContext);

	const {exportParameters, importParameters, resetParameters} =
		useParameterImportExport(namespace);

	const {createModelState, applyModelStateToQueryParameter} =
		useCreateModelState({namespace});

	const onCreateModelState = useCallback(async () => {
		setIsCreatingModelState(true);
		const {modelStateId} = await createModelState(
			undefined, // <-- parameterNamesToInclude: use default according to the theme
			undefined, // <-- parameterNamesToExclude: use default according to the theme
			true, // <-- includeImage,
			undefined, // <-- custom data
			false, // <-- includeGltf
		);

		if (modelStateId) {
			const url = applyModelStateToQueryParameter(modelStateId);
			notifications.success({
				message: (
					<ModelStateNotificationCreated
						modelStateId={modelStateId}
						link={url.toString()}
					/>
				),
			});
		}

		setIsCreatingModelState(false);
	}, []);

	const sections: {
		name: string;
		onClick: () => void;
		disabled?: boolean;
	}[][] = useMemo(
		() => [
			[
				{
					name: "Reset to default values",
					onClick: resetParameters,
					disabled: disabled || isCreatingModelState,
				},
			],
			[
				{
					name: "Import parameter values",
					onClick: importParameters,
					disabled: disabled || isCreatingModelState,
				},
				{
					name: "Export parameter values",
					onClick: exportParameters,
					disabled: disabled || isCreatingModelState,
				},
			],
			[
				{
					name: "Create model state",
					onClick: onCreateModelState,
					disabled: disabled || isCreatingModelState,
				},
				{
					name: "Import model state",
					onClick: () => setIsImportDialogOpen(true),
					disabled: disabled || isCreatingModelState,
				},
			],
		],
		[disabled, isCreatingModelState],
	);

	return (
		<>
			<ViewportIconButtonDropdown
				iconType={"tabler:dots-vertical"}
				tooltip="More options"
				disabled={disabled}
				sections={sections}
				menuDropdownProps={menuDropdownProps}
				visible={visible}
				size={size}
				color={color}
				colorDisabled={colorDisabled}
				variant={variant}
				variantDisabled={variantDisabled}
				iconStyle={iconStyle}
			/>
			<ImportModelStateDialog
				opened={isImportDialogOpen}
				onClose={() => setIsImportDialogOpen(false)}
				namespace={namespace}
			/>
		</>
	);
}
