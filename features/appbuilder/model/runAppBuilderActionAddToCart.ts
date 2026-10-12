import {IAppBuilderActionPropsAddToCart} from "@AppBuilderLib/features/appbuilder/config/appbuilder";
import {
	AppBuilderActionRunContext,
	resolvedViewportId,
} from "@AppBuilderLib/features/appbuilder/config/appBuilderActionRun";
import {ECommerceApiSingleton} from "@AppBuilderLib/features/ecommerce/api/singleton";
import {getNotificationActions} from "@AppBuilderLib/features/notifications/model/useNotificationStore";
import {applyAddToCartActionThemeDefaults} from "./addToCartActionThemeDefaults";
import {
	addToCartErrorMessage,
	addToCartSuccessMessage,
	resolveThrownAddToCartError,
	toAddToCartApiFailure,
	toAddToCartApiSuccess,
	type AddToCartApiResult,
} from "./addToCartNotification";
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
	const modelStateId = resultModelState.modelStateId;
	const api = await ECommerceApiSingleton;
	try {
		const result = await api.addItemToCart({
			modelStateId,
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
			...(props.properties !== undefined
				? {properties: props.properties}
				: {}),
		});
		return {
			modelStateId,
			cartItemId: result.id,
			successMessage: result.successMessage,
		};
	} catch (error) {
		throw resolveThrownAddToCartError(error, modelStateId);
	}
}

/** E-commerce and tools result for add to cart. No toasts. */
export async function addToCartApiResult(
	props: IAppBuilderActionPropsAddToCart,
	context: AppBuilderActionRunContext,
): Promise<AddToCartApiResult> {
	try {
		return toAddToCartApiSuccess(await addToCartFromStores(props, context));
	} catch (error) {
		return toAddToCartApiFailure(error);
	}
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
			message: addToCartSuccessMessage({
				replySuccessMessage: result.successMessage,
				actionSuccessMessage: themed.successMessage,
				modelStateId,
				cartItemId: result.cartItemId,
			}),
		});
	} catch (e) {
		getNotificationActions().error({
			message: addToCartErrorMessage({
				error: e,
				actionErrorMessage: themed.errorMessage,
				modelStateId,
			}),
		});
		throw e;
	}
}
