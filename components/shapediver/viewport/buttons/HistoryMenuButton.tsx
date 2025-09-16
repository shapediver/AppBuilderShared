import ModelStateNotificationCreated from "@AppBuilderShared/components/shapediver/modelState/ModelStateNotificationCreated";
import ImportModelStateDialog from "@AppBuilderShared/components/shapediver/ui/ImportModelStateDialog";
import {NotificationContext} from "@AppBuilderShared/context/NotificationContext";
import {useParameterImportExport} from "@AppBuilderShared/hooks/shapediver/parameters/useParameterImportExport";
import {useCreateModelState} from "@AppBuilderShared/hooks/shapediver/useCreateModelState";
import React, {useCallback, useContext, useMemo, useState} from "react";
import {CommonButtonProps} from "./types";
import ViewportIconButtonDropdown from "./ViewportIconButtonDropdown";

interface HistoryMenuButtonProps extends CommonButtonProps {
	disabled: boolean;
	namespace: string;
	visible?: boolean;
}

export default function HistoryMenuButton({
	disabled,
	namespace,
	visible = true,
}: HistoryMenuButtonProps) {
	const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
	const [isCreatingModelState, setIsCreatingModelState] = useState(false);

	const notifications = useContext(NotificationContext);

	const {exportParameters, importParameters} =
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
				viewportIconButtonProps={{
					iconType: "tabler:dots-vertical",
					label: "More options",
				}}
				disabled={disabled}
				sections={sections}
				visible={visible}
			/>
			<ImportModelStateDialog
				opened={isImportDialogOpen}
				onClose={() => setIsImportDialogOpen(false)}
				namespace={namespace}
			/>
		</>
	);
}
