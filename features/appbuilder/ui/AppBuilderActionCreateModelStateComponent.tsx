import {ECommerceApiSingleton} from "@AppBuilderLib/features/ecommerce/api/singleton";
import {resolveModelStateMessage} from "@AppBuilderLib/features/model-state/lib/resolveModelStateMessage";
import {useCreateModelState} from "@AppBuilderLib/features/model-state/model/useCreateModelState";
import {useNotificationStore} from "@AppBuilderLib/features/notifications/model/useNotificationStore";
import NotificationModelStateCreated from "@AppBuilderLib/features/notifications/ui/NotificationModelStateCreated";
import {useCallback, useState} from "react";
import {IAppBuilderLegacyActionPropsCreateModelState} from "../config/appbuilder";
import AppBuilderActionComponent from "./AppBuilderActionComponent";

type Props = IAppBuilderLegacyActionPropsCreateModelState & {
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
		includeImage,
		image,
		includeGltf,
		parameterNamesToInclude,
		parameterNamesToExclude,
		successMessage,
		errorMessage,
	} = props;
	const {success, error} = useNotificationStore();

	const {
		createModelState,
		successMessage: themeSuccessMessage,
		errorMessage: themeErrorMessage,
	} = useCreateModelState({namespace});

	const [loading, setLoading] = useState(false);

	const onClick = useCallback(async () => {
		setLoading(true);

		try {
			const {modelStateId, screenshot} = await createModelState({
				parameterNamesToInclude,
				parameterNamesToExclude,
				includeImage,
				image,
				data: undefined, // <-- custom data
				includeGltf,
			});

			// Save the modelStateId as a search parameter
			if (modelStateId) {
				// in case we are not running inside an iframe, the instance of
				// IEcommerceApi is a dummy implementation
				const api = await ECommerceApiSingleton;
				const {href} = await api.updateSharingLink({
					modelStateId,
					updateUrl: true,
					imageUrl: screenshot,
				});
				const resolvedSuccessMessage = resolveModelStateMessage(
					successMessage ?? themeSuccessMessage,
					modelStateId,
				);

				if (resolvedSuccessMessage) {
					success({
						message: resolvedSuccessMessage,
					});
				} else {
					success({
						message: (
							<NotificationModelStateCreated
								modelStateId={modelStateId}
								link={href}
							/>
						),
					});
				}
			}
		} catch (e) {
			error({
				message:
					resolveModelStateMessage(
						errorMessage ?? themeErrorMessage,
					) ?? "An error happened while saving the model state.",
			});
			throw e;
		} finally {
			setLoading(false);
		}
	}, [
		createModelState,
		parameterNamesToInclude,
		parameterNamesToExclude,
		image,
		includeImage,
		includeGltf,
		successMessage,
		errorMessage,
		themeSuccessMessage,
		themeErrorMessage,
		success,
		error,
	]);

	return (
		<AppBuilderActionComponent
			label={label}
			icon={icon}
			tooltip={tooltip}
			onClick={onClick}
			loading={loading}
		/>
	);
}
