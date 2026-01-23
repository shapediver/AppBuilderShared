import NotificationModelStateCreated from "@AppBuilderShared/components/shapediver/notifications/NotificationModelStateCreated";
import ImportModelStateDialog from "@AppBuilderShared/components/shapediver/ui/ImportModelStateDialog";
import {useParameterImportExport} from "@AppBuilderShared/hooks/shapediver/parameters/useParameterImportExport";
import {useCreateModelState} from "@AppBuilderShared/hooks/shapediver/useCreateModelState";
import {ECommerceApiSingleton} from "@AppBuilderShared/modules/ecommerce/singleton";
import React, {useCallback, useMemo, useState} from "react";
import {useNotificationStore} from "~/shared/shared/model/useNotificationStore";
import {CommonButtonProps} from "./types";
import ViewportIconButtonDropdown from "./ViewportIconButtonDropdown";

interface HistoryMenuButtonProps extends CommonButtonProps {
	disabled?: boolean;
	namespace: string;
	visible?: boolean;
	enableImportExportButtons?: boolean;
	enableModelStateButtons?: boolean;
}

export default function HistoryMenuButton({
	disabled = false,
	namespace,
	visible = true,
	enableImportExportButtons = true,
	enableModelStateButtons = true,
}: HistoryMenuButtonProps) {
	const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
	const [isCreatingModelState, setIsCreatingModelState] = useState(false);

	const notifications = useNotificationStore();

	const {exportParameters, importParameters} =
		useParameterImportExport(namespace);

	const {createModelState} = useCreateModelState({namespace});

	const onCreateModelState = useCallback(async () => {
		setIsCreatingModelState(true);
		const {modelStateId} = await createModelState(
			undefined, // <-- parameterNamesToInclude: use default according to the theme
			undefined, // <-- parameterNamesToExclude: use default according to the theme
			true, // <-- includeImage,
			undefined, // <-- image
			undefined, // <-- custom data
			false, // <-- includeGltf
		);

		if (modelStateId) {
			// in case we are not running inside an iframe, the instance of
			// IEcommerceApi is a dummy implementation
			const api = await ECommerceApiSingleton;
			const {href} = await api.updateSharingLink({
				modelStateId,
				updateUrl: true,
			});
			notifications.success({
				message: (
					<NotificationModelStateCreated
						modelStateId={modelStateId}
						link={href}
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
			enableImportExportButtons
				? [
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
					]
				: [],
			enableModelStateButtons
				? [
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
					]
				: [],
		],
		[
			disabled,
			isCreatingModelState,
			enableImportExportButtons,
			enableModelStateButtons,
		],
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
