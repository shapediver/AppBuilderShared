import {ECommerceApiSingleton} from "@AppBuilderLib/features/ecommerce/api/singleton";
import {useNotificationStore} from "@AppBuilderLib/features/notifications/model/useNotificationStore";
import {useCallback, useState} from "react";
import {IAppBuilderActionPropsMessageToParent} from "../config/appbuilder";

export interface UseAppBuilderActionMessageToParentProps extends IAppBuilderActionPropsMessageToParent {
	disabled?: boolean;
}

/** Logic for the "messageToParent" action. Can be used without the action component. */
export function useAppBuilderActionMessageToParent(
	props: UseAppBuilderActionMessageToParentProps,
) {
	const {type, data, disabled} = props;
	const notifications = useNotificationStore();
	const [loading, setLoading] = useState(false);

	const trigger = useCallback(async () => {
		setLoading(true);
		// in case we are not running inside an iframe, the instance of
		// IEcommerceApi will be a dummy for testing
		const api = await ECommerceApiSingleton;

		try {
			const result = await api.messageToParent({
				type,
				data,
			});
			if (result.notification) {
				const {type, data} = result.notification;
				if (type === "error") {
					notifications.error(data);
				} else if (type === "warning") {
					notifications.warning(data);
				} else if (type === "success") {
					notifications.success(data);
				} else {
					notifications.show(data);
				}
			}
		} catch (e) {
			notifications.error({
				message: `An error happened while sending message ${type} to the parent page.`,
			});
			throw e;
		} finally {
			setLoading(false);
		}
	}, [data, notifications, type]);

	return {
		trigger,
		disabled,
		loading,
	};
}
