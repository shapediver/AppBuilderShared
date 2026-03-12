import {ECommerceApiSingleton} from "@AppBuilderLib/features/ecommerce/api/singleton";
import {useCreateModelState} from "@AppBuilderLib/features/model-state/model/useCreateModelState";
import {useNotificationStore} from "@AppBuilderLib/features/notifications";
import {INotificationModelStateCreatedProps} from "@AppBuilderLib/features/notifications/ui/NotificationModelStateCreated";
import {useKeyBinding} from "@AppBuilderLib/shared/lib/useKeyBinding";
import {useCallback} from "react";

interface Props {
	namespace: string;
	getNotification: (
		props: INotificationModelStateCreatedProps,
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
	const {createModelState} = useCreateModelState({namespace});
	const notifications = useNotificationStore();

	const callback = useCallback(async () => {
		const {modelStateId, screenshot} = await createModelState(
			undefined, // <-- parameterNamesToInclude: use default according to the theme
			undefined, // <-- parameterNamesToExclude: use default according to the theme
			true, // <-- includeImage,
			undefined, // <-- image
			undefined, // <-- custom data
			false, // <-- includeGltf
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
			notifications.success({
				message: getNotification({
					modelStateId,
					link: href.toString(),
				}),
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
