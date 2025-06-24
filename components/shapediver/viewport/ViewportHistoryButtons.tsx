import ImportModelStateDialog from "@AppBuilderShared/components/shapediver/ui/ImportModelStateDialog";
import Icon from "@AppBuilderShared/components/ui/Icon";
import TooltipWrapper from "@AppBuilderShared/components/ui/TooltipWrapper";
import {NotificationContext} from "@AppBuilderShared/context/NotificationContext";
import {useParameterImportExport} from "@AppBuilderShared/hooks/shapediver/parameters/useParameterImportExport";
import {useCreateModelState} from "@AppBuilderShared/hooks/shapediver/useCreateModelState";
import {useImportModelState} from "@AppBuilderShared/hooks/shapediver/useImportModelState";
import {useViewportHistory} from "@AppBuilderShared/hooks/shapediver/viewer/useViewportHistory";
import {useShapeDiverStoreParameters} from "@AppBuilderShared/store/useShapeDiverStoreParameters";
import {IconTypeEnum} from "@AppBuilderShared/types/shapediver/icons";
import {ActionIcon, Box, MantineStyleProp, Menu} from "@mantine/core";
import React, {useCallback, useContext, useMemo, useState} from "react";

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
	 * Namespace of the session
	 */
	namespace: string;
}

const defaultProps: Required<Omit<Props, "namespace">> = {
	style: {display: "flex", gap: "0.25rem"},
	size: 32,
	color: "black",
	colorDisabled: "grey",
	variant: "subtle",
	variantDisabled: "transparent",
	iconStyle: {m: "0.188rem"},
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
		namespace,
	} = {...defaultProps, ...props};

	const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);

	const {canGoBack, canGoForward, goBack, goForward} = useViewportHistory();

	const notifications = useContext(NotificationContext);

	const {exportParameters, importParameters, resetParameters} =
		useParameterImportExport(namespace);

	const {importModelState, isLoading: isModelStateLoading} =
		useImportModelState(namespace);

	const [isCreatingModelState, setIsCreatingModelState] = useState(false);
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
			applyModelStateToQueryParameter(modelStateId);
			notifications.success({
				message: "Model state successfully created",
			});
		}

		setIsCreatingModelState(false);
	}, []);

	const parameterChanges = useShapeDiverStoreParameters(
		useCallback(
			(state) => {
				const ids = state.sessionDependency[namespace];
				return ids
					.map((id) => state.parameterChanges[id])
					.filter(Boolean);
			},
			[namespace],
		),
	);

	const executing = useMemo(
		() => parameterChanges.some((change) => change.executing),
		[parameterChanges],
	);

	const hasPendingChanges = useMemo(
		() =>
			parameterChanges.length > 0 &&
			parameterChanges.some((c) => Object.keys(c.values).length > 0),
		[parameterChanges],
	);

	const handleImportModelState = async (modelStateId: string) => {
		const success = await importModelState(modelStateId);
		if (success) {
			setIsImportDialogOpen(false);
		}
	};

	const buttonsDisabled =
		hasPendingChanges || isModelStateLoading || isCreatingModelState;

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
						onClick={onCreateModelState}
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
