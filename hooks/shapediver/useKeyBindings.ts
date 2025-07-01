import {IModelStateNotificationCreatedProps} from "@AppBuilderShared/components/shapediver/modelState/ModelStateNotificationCreated";
import {NotificationContext} from "@AppBuilderShared/context/NotificationContext";
import {useCreateModelState} from "@AppBuilderShared/hooks/shapediver/useCreateModelState";
import {useKeyBinding} from "@AppBuilderShared/hooks/shapediver/useKeyBinding";
import {ECommerceApiSingleton} from "@AppBuilderShared/modules/ecommerce/singleton";
import {useCallback, useContext} from "react";

interface Props {
	namespace: string;
	getNotification: (
		props: IModelStateNotificationCreatedProps,
	) => React.ReactNode;
}

/**
 * Hook providing standard key bindings.
 *
 * @param props
 * @returns
 */
export function useKeyBindings(props: Props) {
	const {namespace, getNotification} = props;
	const {createModelState, applyModelStateToQueryParameter} =
		useCreateModelState({namespace});
	const notifications = useContext(NotificationContext);

	const callback = useCallback(async () => {
		const {modelStateId, screenshot} = await createModelState(
			undefined, // <-- parameterNamesToInclude: use default according to the theme
			undefined, // <-- parameterNamesToExclude: use default according to the theme
			true, // <-- includeImage,
			undefined, // <-- custom data
			false, // <-- includeGltf
		);

		// Save the modelStateId as a search parameter
		if (modelStateId) {
			const url = applyModelStateToQueryParameter(modelStateId);
			notifications.success({
				message: getNotification({
					modelStateId,
					link: url.toString(),
				}),
			});
			// in case we are not running inside an iframe, the instance of
			// IEcommerceApi will be a dummy for testing
			const api = await ECommerceApiSingleton;
			await api.updateSharingLink({
				modelStateId,
				imageUrl: screenshot,
			});
		}
	}, [createModelState]);

	useKeyBinding({
		key: "s",
		timeout: 750,
		hits: 3,
		callback,
	});

	return {};
}
