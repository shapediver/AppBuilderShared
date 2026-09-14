import {IAppBuilderActionPropsMessageToParent} from "@AppBuilderLib/features/appbuilder/config/appbuilder";
import {ECommerceApiSingleton} from "@AppBuilderLib/features/ecommerce/api/singleton";
import {getNotificationActions} from "@AppBuilderLib/features/notifications/model/useNotificationStore";

/** Send a message to the parent page through the e-commerce iframe API. */
export async function runAppBuilderActionMessageToParent(
	props: IAppBuilderActionPropsMessageToParent,
): Promise<void> {
	const api = await ECommerceApiSingleton;
	const result = await api.messageToParent({
		type: props.type,
		data: props.data,
	});
	if (!result.notification) return;
	const {type, data} = result.notification;
	const notifications = getNotificationActions();
	if (type === "error") notifications.error(data);
	else if (type === "warning") notifications.warning(data);
	else if (type === "success") notifications.success(data);
	else notifications.show(data);
}
