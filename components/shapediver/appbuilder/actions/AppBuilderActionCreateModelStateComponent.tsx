import AppBuilderActionComponent from "@AppBuilderShared/components/shapediver/appbuilder/actions/AppBuilderActionComponent";
import ModelStateNotificationCreated from "@AppBuilderShared/components/shapediver/modelState/ModelStateNotificationCreated";
import {NotificationContext} from "@AppBuilderShared/context/NotificationContext";
import {useCreateModelState} from "@AppBuilderShared/hooks/shapediver/useCreateModelState";
import {ECommerceApiSingleton} from "@AppBuilderShared/modules/ecommerce/singleton";
import {IAppBuilderLegacyActionPropsCreateModelState} from "@AppBuilderShared/types/shapediver/appbuilder";
import {IconTypeEnum} from "@AppBuilderShared/types/shapediver/icons";
import React, {useCallback, useContext, useState} from "react";

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
		icon = IconTypeEnum.DeviceFloppy,
		tooltip,
		namespace,
		includeImage,
		//image, // TODO use image defined by export of href
		includeGltf,
		parameterNamesToInclude,
		parameterNamesToExclude,
	} = props;
	const notifications = useContext(NotificationContext);

	const {createModelState, applyModelStateToQueryParameter} =
		useCreateModelState({namespace});

	const [loading, setLoading] = useState(false);

	const onClick = useCallback(async () => {
		setLoading(true);

		const {modelStateId, screenshot} = await createModelState(
			parameterNamesToInclude,
			parameterNamesToExclude,
			includeImage,
			undefined, // <-- custom data
			includeGltf,
		);

		// Save the modelStateId as a search parameter
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
			// in case we are not running inside an iframe, the instance of
			// IEcommerceApi will be a dummy for testing
			const api = await ECommerceApiSingleton;
			await api.updateSharingLink({modelStateId, imageUrl: screenshot});
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
