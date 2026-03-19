import {ECommerceApiSingleton} from "@AppBuilderLib/features/ecommerce/api/singleton";
import {useNotificationStore} from "@AppBuilderLib/features/notifications";
import React, {useCallback} from "react";
import {IAppBuilderLegacyActionPropsCloseConfigurator} from "../config/appbuilder";
import AppBuilderActionComponent from "./AppBuilderActionComponent";

type Props = IAppBuilderLegacyActionPropsCloseConfigurator & {};

/**
 * Functional component for an "closeConfigurator" action.
 *
 * @returns
 */
export default function AppBuilderActionCloseConfiguratorComponent(
	props: Props,
) {
	const {label = "Close configurator", icon = "tabler:x", tooltip} = props;
	const notifications = useNotificationStore();

	const onClick = useCallback(async () => {
		// in case we are not running inside an iframe, the instance of
		// IEcommerceApi will be a dummy for testing
		const api = await ECommerceApiSingleton;
		const result = await api.closeConfigurator();
		if (!result)
			notifications.error({message: "Could not close configurator."});
	}, []);

	return (
		<AppBuilderActionComponent
			label={label}
			icon={icon}
			tooltip={tooltip}
			onClick={onClick}
		/>
	);
}
