import AppBuilderActionComponent from "@AppBuilderShared/components/shapediver/appbuilder/actions/AppBuilderActionComponent";
import ModelStateNotificationCreated from "@AppBuilderShared/components/shapediver/modelState/ModelStateNotificationCreated";
import { NotificationContext } from "@AppBuilderShared/context/NotificationContext";
import { useCreateModelState } from "@AppBuilderShared/hooks/shapediver/useCreateModelState";
import { ECommerceApiSingleton } from "@AppBuilderShared/modules/ecommerce/singleton";
import { IAppBuilderLegacyActionPropsCreateModelState } from "@AppBuilderShared/types/shapediver/appbuilder";
import React, { useCallback, useContext, useState } from "react";

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
	const notifications = useContext(NotificationContext);

	const { createModelState } = useCreateModelState({ namespace });

	const [loading, setLoading] = useState(false);

	const onClick = useCallback(async () => {
		setLoading(true);

		const { modelStateId, screenshot } = await createModelState(
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
			const { href } = await api.updateSharingLink({
				modelStateId,
				updateUrl: true,
				imageUrl: screenshot,
			});
			notifications.success({
				message: (
					<ModelStateNotificationCreated
						modelStateId={modelStateId}
						link={href}
					/>
				),
			});
		}

		setLoading(false);
	}, [createModelState, includeImage, includeGltf]);

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
