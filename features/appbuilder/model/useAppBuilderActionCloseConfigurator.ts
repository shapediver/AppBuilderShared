import {ECommerceApiSingleton} from "@AppBuilderLib/features/ecommerce/api/singleton";
import {useNotificationStore} from "@AppBuilderLib/features/notifications/model/useNotificationStore";
import {useCallback} from "react";

export interface UseAppBuilderActionCloseConfiguratorProps {
	disabled?: boolean;
}

/** Logic for the "closeConfigurator" action. Can be used without the action component. */
export function useAppBuilderActionCloseConfigurator(
	props: UseAppBuilderActionCloseConfiguratorProps = {},
) {
	const {disabled} = props;
	const notifications = useNotificationStore();

	const trigger = useCallback(async () => {
		// in case we are not running inside an iframe, the instance of
		// IEcommerceApi will be a dummy for testing
		const api = await ECommerceApiSingleton;
		const result = await api.closeConfigurator();
		if (!result)
			notifications.error({message: "Could not close configurator."});
	}, [notifications]);

	return {
		trigger,
		disabled,
	};
}
