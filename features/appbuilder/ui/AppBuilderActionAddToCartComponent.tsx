import {useAppBuilderActionAddToCart} from "@AppBuilderLib/features/appbuilder/model/useAppBuilderActionAddToCart";
import {IAppBuilderLegacyActionPropsAddToCart} from "../config/appbuilder";
import AppBuilderActionBase, {
	AppBuilderActionRenderProps,
} from "./AppBuilderActionBase";

type Props = IAppBuilderLegacyActionPropsAddToCart &
	AppBuilderActionRenderProps & {
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
		screenshotProps,
		parameterNamesToInclude,
		parameterNamesToExclude,
		successMessage,
		errorMessage,
		presentation,
		toolbarButtonProps,
		disabled,
		title,
	} = props;
	const {trigger, loading} = useAppBuilderActionAddToCart({
		namespace,
		productId,
		quantity,
		price,
		description,
		includeImage,
		image,
		includeGltf,
		screenshotProps,
		parameterNamesToInclude,
		parameterNamesToExclude,
		successMessage,
		errorMessage,
		disabled,
		title,
	});

	return (
		<AppBuilderActionBase
			presentation={presentation}
			label={label}
			icon={icon}
			tooltip={tooltip}
			onClick={trigger}
			loading={loading}
			disabled={disabled}
			toolbarButtonProps={toolbarButtonProps}
		/>
	);
}
