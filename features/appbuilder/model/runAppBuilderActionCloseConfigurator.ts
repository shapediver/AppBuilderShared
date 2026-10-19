import {ECommerceApiSingleton} from "@AppBuilderLib/features/ecommerce/api/singleton";
import {getNotificationActions} from "@AppBuilderLib/features/notifications/model/useNotificationStore";

/** Close the configurator through the e-commerce iframe API. */
export async function runAppBuilderActionCloseConfigurator(): Promise<void> {
	const api = await ECommerceApiSingleton;
	const result = await api.closeConfigurator();
	if (!result)
		getNotificationActions().error({
			message: "Could not close configurator.",
		});
}
