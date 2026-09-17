import {IAppBuilderActionPropsAddToCart} from "@AppBuilderLib/features/appbuilder/config/appbuilder";
import {
	AppBuilderActionRunContext,
	resolvedViewportId,
} from "@AppBuilderLib/features/appbuilder/config/appBuilderActionRun";
import {ECommerceApiSingleton} from "@AppBuilderLib/features/ecommerce/api/singleton";
import {resolveModelStateMessage} from "@AppBuilderLib/features/model-state/lib/resolveModelStateMessage";
import {getNotificationActions} from "@AppBuilderLib/features/notifications/model/useNotificationStore";
import {applyAddToCartActionThemeDefaults} from "./addToCartActionThemeDefaults";
import {createModelStateFromStores} from "./runAppBuilderActionCreateModelState";

/** Create a model state and add it to the cart. No toasts. */
export async function addToCartFromStores(
	props: IAppBuilderActionPropsAddToCart,
	context: AppBuilderActionRunContext,
) {
	const themed = applyAddToCartActionThemeDefaults(props);
	const resultModelState = await createModelStateFromStores(
		context.namespace,
		resolvedViewportId(context),
		{
			...props,
			screenshotProps: themed.screenshotProps,
		},
	);
	const api = await ECommerceApiSingleton;
	const result = await api.addItemToCart({
		modelStateId: resultModelState.modelStateId,
		productId: props.productId,
		quantity: props.quantity,
		price: props.price,
		description: props.description,
		title: props.title,
		imageUrl: resultModelState.screenshot,
		modelViewUrl: resultModelState.modelViewUrl,
		modelStateImageUrl: resultModelState.modelStateImageUrl,
		modelStateGltfUrl: resultModelState.modelStateGltfUrl,
		modelStateUsdzUrl: resultModelState.modelStateUsdzUrl,
	});
	return {
		modelStateId: resultModelState.modelStateId,
		cartItemId: result.id,
	};
}

/** Create a model state and add it to the cart. */
export async function runAppBuilderActionAddToCart(
	props: IAppBuilderActionPropsAddToCart,
	context: AppBuilderActionRunContext,
): Promise<void> {
	const themed = applyAddToCartActionThemeDefaults(props);
	let modelStateId: string | undefined;
	try {
		const result = await addToCartFromStores(props, context);
		modelStateId = result.modelStateId;
		getNotificationActions().success({
			message:
				resolveModelStateMessage(themed.successMessage, modelStateId) ??
				`An item for configuration ID ${modelStateId} has been added to the cart (cart item id ${result.cartItemId}).`,
		});
	} catch (e) {
		getNotificationActions().error({
			message:
				resolveModelStateMessage(themed.errorMessage, modelStateId) ??
				`An error happened while adding configuration ID ${modelStateId} to the cart.`,
		});
		throw e;
	}
}
