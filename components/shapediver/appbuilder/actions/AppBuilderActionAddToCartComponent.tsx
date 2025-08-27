import AppBuilderActionComponent from "@AppBuilderShared/components/shapediver/appbuilder/actions/AppBuilderActionComponent";
import {NotificationContext} from "@AppBuilderShared/context/NotificationContext";
import {useCreateModelState} from "@AppBuilderShared/hooks/shapediver/useCreateModelState";
import {ECommerceApiSingleton} from "@AppBuilderShared/modules/ecommerce/singleton";
import {IAppBuilderLegacyActionPropsAddToCart} from "@AppBuilderShared/types/shapediver/appbuilder";
import React, {useCallback, useContext, useState} from "react";

type Props = IAppBuilderLegacyActionPropsAddToCart & {
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
		icon = "tabler:shopping-cart-plus",
		tooltip,
		namespace,
		productId,
		quantity,
		price,
		description,
		includeImage,
		//image, // TODO use image defined by export of href
		includeGltf,
		parameterNamesToInclude,
		parameterNamesToExclude,
	} = props;

	const {createModelState} = useCreateModelState({namespace});

	const notifications = useContext(NotificationContext);

	const [loading, setLoading] = useState(false);

	const onClick = useCallback(async () => {
		setLoading(true);
		// in case we are not running inside an iframe, the instance of
		// IEcommerceApi will be a dummy for testing
		const api = await ECommerceApiSingleton;
		const {modelStateId, screenshot} = await createModelState(
			parameterNamesToInclude,
			parameterNamesToExclude,
			includeImage,
			undefined, // <-- custom data
			includeGltf,
		);
		try {
			const result = await api.addItemToCart({
				modelStateId,
				productId,
				quantity,
				price,
				description,
				imageUrl: screenshot,
			});
			// TODO display modal instead of notification, offer possibility to hide configurator
			notifications.success({
				message: `An item for configuration ID ${modelStateId} has been added to the cart (cart item id ${result.id}).`,
			});
		} catch (e) {
			notifications.error({
				message: `An error happened while adding configuration ID ${modelStateId} to the cart.`,
			});
			// TODO report error to sentry
			throw e;
		} finally {
			setLoading(false);
		}
	}, [
		productId,
		quantity,
		price,
		description,
		createModelState,
		includeImage,
		includeGltf,
	]);

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
