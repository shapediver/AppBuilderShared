import ModelStateNotificationCreated from "@AppBuilderShared/components/shapediver/modelState/ModelStateNotificationCreated";
import ImportModelStateDialog from "@AppBuilderShared/components/shapediver/ui/ImportModelStateDialog";
import Icon from "@AppBuilderShared/components/ui/Icon";
import {NotificationContext} from "@AppBuilderShared/context/NotificationContext";
import {useParameterImportExport} from "@AppBuilderShared/hooks/shapediver/parameters/useParameterImportExport";
import {useCreateModelState} from "@AppBuilderShared/hooks/shapediver/useCreateModelState";
import {IconTypeEnum} from "@AppBuilderShared/types/shapediver/icons";
import {ActionIcon, Menu} from "@mantine/core";
import React, {useCallback, useContext, useState} from "react";
import classes from "../ViewportIcons.module.css";
import {CommonButtonProps, IconProps} from "./types";

interface HistoryMenuButtonProps extends CommonButtonProps {
	disabled: boolean;
	namespace: string;
	enableResetButton?: boolean;
	enableImportExportButtons?: boolean;
	enableModelStateButtons?: boolean;
}

export default function HistoryMenuButton({
	disabled,
	namespace,
	enableResetButton = false,
	enableImportExportButtons = false,
	enableModelStateButtons = false,
	size = undefined,
	color = IconProps.color,
	colorDisabled = IconProps.colorDisabled,
	variant = IconProps.variant,
	variantDisabled = IconProps.variantDisabled,
	iconStyle = IconProps.style,
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

	const hasMenuItems =
		enableResetButton ||
		enableImportExportButtons ||
		enableModelStateButtons;

	if (!hasMenuItems) return null;

	return (
		<>
			<Menu shadow="md" width={200} position="bottom-end">
				<Menu.Target>
					<ActionIcon
						size={size}
						variant={
							disabled || isCreatingModelState
								? variantDisabled
								: variant
						}
						aria-label="More options"
						style={iconStyle}
						disabled={disabled}
						className={classes.ViewportIcon}
					>
						<Icon
							type={IconTypeEnum.DotsVertical}
							color={
								disabled || isCreatingModelState
									? colorDisabled
									: color
							}
						/>
					</ActionIcon>
				</Menu.Target>

				<Menu.Dropdown>
					{enableResetButton && (
						<Menu.Item
							onClick={resetParameters}
							disabled={disabled || isCreatingModelState}
						>
							Reset to default values
						</Menu.Item>
					)}
					{enableImportExportButtons && (
						<>
							{enableResetButton && <Menu.Divider />}
							<Menu.Item
								onClick={importParameters}
								disabled={disabled || isCreatingModelState}
							>
								Import parameter values
							</Menu.Item>
							<Menu.Item
								onClick={exportParameters}
								disabled={disabled || isCreatingModelState}
							>
								Export parameter values
							</Menu.Item>
						</>
					)}
					{enableModelStateButtons && (
						<>
							{(enableResetButton ||
								enableImportExportButtons) && <Menu.Divider />}
							<Menu.Item
								onClick={onCreateModelState}
								disabled={disabled || isCreatingModelState}
							>
								Create model state
							</Menu.Item>
							<Menu.Item
								onClick={() => setIsImportDialogOpen(true)}
								disabled={disabled || isCreatingModelState}
							>
								Import model state
							</Menu.Item>
						</>
					)}
				</Menu.Dropdown>
			</Menu>

			{enableModelStateButtons && (
				<ImportModelStateDialog
					opened={isImportDialogOpen}
					onClose={() => setIsImportDialogOpen(false)}
					namespace={namespace}
				/>
			)}
		</>
	);
}
