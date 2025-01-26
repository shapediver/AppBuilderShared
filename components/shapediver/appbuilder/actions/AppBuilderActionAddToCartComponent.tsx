import React, { useCallback, useContext } from "react";
import { IAppBuilderActionPropsAddToCart } from "@AppBuilderShared/types/shapediver/appbuilder";
import AppBuilderActionComponent from "@AppBuilderShared/components/shapediver/appbuilder/actions/AppBuilderActionComponent";
import { ECommerceApiSingleton } from "@AppBuilderShared/modules/ecommerce/singleton";
import { NotificationContext } from "@AppBuilderShared/context/NotificationContext";
import { useCreateModelState } from "@AppBuilderShared/hooks/shapediver/useCreateModelState";
import { IconTypeEnum } from "@AppBuilderShared/types/shapediver/icons";

type Props = IAppBuilderActionPropsAddToCart & {
	namespace: string;
};

/**
 * Functional component for an "addToCart" action.
 *
 * @returns
 */
export default function AppBuilderActionAddToCartComponent(props: Props) {

	const {
		label = "Add to cart",
		icon = IconTypeEnum.ShoppingCartPlus,
		tooltip,
		namespace,
		productId,
		quantity,
		price,
		description,
		includeImage,
		//image, // TODO use image defined by export of href
		includeGltf
	} = props;

	const { createModelState } = useCreateModelState({ namespace });

	const notifications = useContext(NotificationContext);

	const onClick = useCallback(async () => {
		// in case we are not running inside an iframe, the instance of
		// IEcommerceApi will be a dummy for testing
		const api = await ECommerceApiSingleton;
		const modelStateId = await createModelState(
			undefined, // <-- use parameter values of the session
			false, // <-- use parameter values of the session
			includeImage,
			undefined, // <-- custom data
			includeGltf
		);
		try {
			const result = await api.addItemToCart({
				modelStateId,
				productId,
				quantity,
				price,
				description,
			});
			// TODO display modal instead of notification, offer possibility to hide configurator
			notifications.success({message: `An item for configuration ID ${modelStateId} has been added to the cart (cart item id ${result.id}).`});
		} catch (e) {
			notifications.error({message: `An error happened while adding configuration ID ${modelStateId} to the cart.`});
			// TODO report error to sentry
			throw e;
		}
	}, [
		productId,
		quantity,
		price,
		description,
		createModelState,
		includeImage,
		includeGltf
	]);

	return <AppBuilderActionComponent
		label={label}
		icon={icon}
		tooltip={tooltip}
		onClick={onClick}
	/>;
}
