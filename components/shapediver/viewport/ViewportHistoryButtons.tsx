import ImportModelStateDialog from "@AppBuilderShared/components/shapediver/ui/ImportModelStateDialog";
import Icon from "@AppBuilderShared/components/ui/Icon";
import TooltipWrapper from "@AppBuilderShared/components/ui/TooltipWrapper";
import {useParameterImportExport} from "@AppBuilderShared/hooks/shapediver/parameters/useParameterImportExport";
import {useModelState} from "@AppBuilderShared/hooks/shapediver/useModelState";
import {useViewportHistory} from "@AppBuilderShared/hooks/shapediver/viewer/useViewportHistory";
import {useShapeDiverStoreParameters} from "@AppBuilderShared/store/useShapeDiverStoreParameters";
import {IconTypeEnum} from "@AppBuilderShared/types/shapediver/icons";
import {IParameterChanges} from "@AppBuilderShared/types/store/shapediverStoreParameters";
import {ActionIcon, Box, MantineStyleProp, Menu} from "@mantine/core";
import React, {useCallback, useMemo, useState} from "react";

interface Props {
	/**
	 * Style properties for the container
	 */
	style?: React.CSSProperties;
	/**
	 * Size of the action icons
	 */
	size?: number;
	/**
	 * Icon color
	 */
	color?: string;
	/**
	 * Icon color when disabled
	 */
	colorDisabled?: string;
	/**
	 * Button variant
	 */
	variant?: string;
	/**
	 * Button variant when disabled
	 */
	variantDisabled?: string;
	/**
	 * Style for individual icons
	 */
	iconStyle?: MantineStyleProp;
	/**
	 * Optional list of session IDs to check for pending parameter changes.
	 * If provided, buttons will be disabled when there are pending changes for these sessions.
	 */
	sessionIds?: string[];
}

const defaultProps: Required<Omit<Props, "sessionIds">> = {
	style: {display: "flex", gap: "4px"},
	size: 32,
	color: "black",
	colorDisabled: "grey",
	variant: "subtle",
	variantDisabled: "transparent",
	iconStyle: {m: "3px"},
};

/**
 * Component that provides undo/redo buttons and context menu for viewport history management.
 * Includes browser history navigation and parameter/model state management.
 * Buttons are disabled when there are pending parameter changes that need to be accepted or rejected.
 */
export default function ViewportHistoryButtons(props: Props) {
	const {
		style,
		size,
		color,
		colorDisabled,
		variant,
		variantDisabled,
		iconStyle,
		sessionIds,
	} = {...defaultProps, ...props};

	const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);

	const {
		namespace,
		canGoBack,
		canGoForward,
		goBack,
		goForward,
		isLoading,
		sessionReady,
	} = useViewportHistory();

	const {exportParameters, importParameters, resetParameters} =
		useParameterImportExport(namespace || "");

	const {
		createModelState,
		importModelState,
		isLoading: isModelStateLoading,
	} = useModelState(namespace || "");

	const executing = useShapeDiverStoreParameters((state) => {
		const ids = state.sessionDependency[namespace];

		return !ids.every((id) => !state.parameterChanges[id]?.executing);
	});

	const parameterChanges = useShapeDiverStoreParameters(
		useCallback(
			(state) =>
				Object.keys(state.parameterChanges)
					.filter((id) =>
						sessionIds ? sessionIds.includes(id) : true,
					)
					.reduce((acc, id) => {
						acc.push(state.parameterChanges[id]);
						return acc;
					}, [] as IParameterChanges[]),
			[sessionIds],
		),
	);

	const hasPendingChanges = useMemo(
		() =>
			parameterChanges.length > 0 &&
			parameterChanges.some((c) => Object.keys(c.values).length > 0),
		[parameterChanges],
	);

	if (!sessionReady || !namespace) {
		return null;
	}

	const handleImportModelState = async (modelStateId: string) => {
		const success = await importModelState(modelStateId);
		if (success) {
			setIsImportDialogOpen(false);
		}
	};

	const buttonsDisabled =
		hasPendingChanges || isLoading || isModelStateLoading;

	return (
		<Box style={style}>
			<TooltipWrapper
				label={
					hasPendingChanges
						? "Accept or reject changes first"
						: "Undo"
				}
			>
				<ActionIcon
					onClick={goBack}
					disabled={!canGoBack || buttonsDisabled || executing}
					size={size}
					variant={
						!canGoBack || buttonsDisabled
							? variantDisabled
							: variant
					}
					aria-label="Undo"
					style={iconStyle}
				>
					<Icon
						type={IconTypeEnum.ArrowBackUp}
						color={
							!canGoBack || buttonsDisabled
								? colorDisabled
								: color
						}
					/>
				</ActionIcon>
			</TooltipWrapper>

			<TooltipWrapper
				label={
					hasPendingChanges
						? "Accept or reject changes first"
						: "Redo"
				}
			>
				<ActionIcon
					onClick={goForward}
					disabled={!canGoForward || buttonsDisabled || executing}
					size={size}
					variant={
						!canGoForward || buttonsDisabled
							? variantDisabled
							: variant
					}
					aria-label="Redo"
					style={iconStyle}
				>
					<Icon
						type={IconTypeEnum.ArrowForwardUp}
						color={
							!canGoForward || buttonsDisabled
								? colorDisabled
								: color
						}
					/>
				</ActionIcon>
			</TooltipWrapper>

			<Menu shadow="md" width={200} position="bottom-end">
				<Menu.Target>
					<ActionIcon
						size={size}
						variant={buttonsDisabled ? variantDisabled : variant}
						aria-label="More options"
						style={iconStyle}
						disabled={buttonsDisabled}
					>
						<Icon
							type={IconTypeEnum.DotsVertical}
							color={buttonsDisabled ? colorDisabled : color}
						/>
					</ActionIcon>
				</Menu.Target>

				<Menu.Dropdown>
					<Menu.Item
						onClick={resetParameters}
						disabled={buttonsDisabled}
					>
						Reset to default values
					</Menu.Item>
					<Menu.Divider />
					<Menu.Item
						onClick={importParameters}
						disabled={buttonsDisabled}
					>
						Import parameter values
					</Menu.Item>
					<Menu.Item
						onClick={exportParameters}
						disabled={buttonsDisabled}
					>
						Export parameter values
					</Menu.Item>
					<Menu.Divider />
					<Menu.Item
						onClick={createModelState}
						disabled={buttonsDisabled}
					>
						Create model state
					</Menu.Item>
					<Menu.Item
						onClick={() => setIsImportDialogOpen(true)}
						disabled={buttonsDisabled}
					>
						Import model state
					</Menu.Item>
				</Menu.Dropdown>
			</Menu>

			<ImportModelStateDialog
				opened={isImportDialogOpen}
				onClose={() => setIsImportDialogOpen(false)}
				onImport={handleImportModelState}
			/>
		</Box>
	);
}
