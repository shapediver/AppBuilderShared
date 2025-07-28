import AppBuilderActionComponent from "@AppBuilderShared/components/shapediver/appbuilder/actions/AppBuilderActionComponent";
import {NotificationContext} from "@AppBuilderShared/context/NotificationContext";
import {ECommerceApiSingleton} from "@AppBuilderShared/modules/ecommerce/singleton";
import {IAppBuilderLegacyActionPropsCloseConfigurator} from "@AppBuilderShared/types/shapediver/appbuilder";
import {IconTypeEnum} from "@AppBuilderShared/types/shapediver/icons";
import React, {useCallback, useContext} from "react";

type Props = IAppBuilderLegacyActionPropsCloseConfigurator & {};

/**
 * Functional component for an "addToCart" action.
 *
 * @returns
 */
export default function AppBuilderActionCloseConfiguratorComponent(
	props: Props,
) {
	const {
		label = "Close configurator",
		icon = IconTypeEnum.X,
		tooltip,
	} = props;
	const notifications = useContext(NotificationContext);

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
