import {AddToCartActionThemeDefaultProps} from "@AppBuilderLib/features/appbuilder/config/AddToCartAction.theme.types";
import {ECommerceApiSingleton} from "@AppBuilderLib/features/ecommerce/api/singleton";
import {resolveModelStateMessage} from "@AppBuilderLib/features/model-state/lib/resolveModelStateMessage";
import {useCreateModelState} from "@AppBuilderLib/features/model-state/model/useCreateModelState";
import {useNotificationStore} from "@AppBuilderLib/features/notifications/model/useNotificationStore";
import {useProps} from "@mantine/core";
import {useCallback, useState} from "react";
import {IAppBuilderLegacyActionPropsAddToCart} from "../config/appbuilder";
import AppBuilderActionComponent from "./AppBuilderActionComponent";

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
		image,
		includeGltf,
		parameterNamesToInclude,
		parameterNamesToExclude,
		successMessage,
		errorMessage,
	} = props;

	const {
		successMessage: themeSuccessMessage,
		errorMessage: themeErrorMessage,
	} = useProps(
		"AddToCartAction",
		{} as AddToCartActionThemeDefaultProps,
		{} as Partial<AddToCartActionThemeDefaultProps>,
	);

	const {createModelState} = useCreateModelState({namespace});

	const notifications = useNotificationStore();

	const [loading, setLoading] = useState(false);

	const onClick = useCallback(async () => {
		setLoading(true);
		let modelStateId: string | undefined;
		try {
			// in case we are not running inside an iframe, the instance of
			// IEcommerceApi will be a dummy for testing
			const api = await ECommerceApiSingleton;
			const resultModelState = await createModelState({
				parameterNamesToInclude,
				parameterNamesToExclude,
				includeImage,
				image,
				data: undefined, // <-- custom data
				includeGltf,
			});
			modelStateId = resultModelState.modelStateId;
			const result = await api.addItemToCart({
				modelStateId,
				productId,
				quantity,
				price,
				description,
				imageUrl: resultModelState.screenshot,
				modelViewUrl: resultModelState.modelViewUrl,
				modelStateImageUrl: resultModelState.modelStateImageUrl,
				modelStateGltfUrl: resultModelState.modelStateGltfUrl,
				modelStateUsdzUrl: resultModelState.modelStateUsdzUrl,
			});
			// TODO display modal instead of notification, offer possibility to hide configurator
			notifications.success({
				message:
					resolveModelStateMessage(
						successMessage ?? themeSuccessMessage,
						modelStateId,
					) ??
					`An item for configuration ID ${modelStateId} has been added to the cart (cart item id ${result.id}).`,
			});
		} catch (e) {
			notifications.error({
				message:
					resolveModelStateMessage(
						errorMessage ?? themeErrorMessage,
						modelStateId,
					) ??
					`An error happened while adding configuration ID ${modelStateId} to the cart.`,
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
		parameterNamesToInclude,
		parameterNamesToExclude,
		image,
		includeImage,
		includeGltf,
		successMessage,
		errorMessage,
		themeSuccessMessage,
		themeErrorMessage,
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
