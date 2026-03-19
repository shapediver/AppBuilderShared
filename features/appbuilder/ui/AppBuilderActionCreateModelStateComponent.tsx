import {ECommerceApiSingleton} from "@AppBuilderLib/features/ecommerce/api/singleton";
import {useCreateModelState} from "@AppBuilderLib/features/model-state/model/useCreateModelState";
import {useNotificationStore} from "@AppBuilderLib/features/notifications";
import NotificationModelStateCreated from "@AppBuilderLib/features/notifications/ui/NotificationModelStateCreated";
import React, {useCallback, useState} from "react";
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
	} = props;
	const {success} = useNotificationStore();

	const {createModelState} = useCreateModelState({namespace});

	const [loading, setLoading] = useState(false);

	const onClick = useCallback(async () => {
		setLoading(true);

		const {modelStateId, screenshot} = await createModelState(
			parameterNamesToInclude,
			parameterNamesToExclude,
			includeImage,
			image,
			undefined, // <-- custom data
			includeGltf,
		);

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
			success({
				message: (
					<NotificationModelStateCreated
						modelStateId={modelStateId}
						link={href}
					/>
				),
			});
		}

		setLoading(false);
	}, [
		createModelState,
		parameterNamesToInclude,
		parameterNamesToExclude,
		image,
		includeImage,
		includeGltf,
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
