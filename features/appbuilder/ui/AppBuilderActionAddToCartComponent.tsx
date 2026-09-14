import {createActionClickHandler} from "@AppBuilderLib/features/appbuilder/lib/createActionClickHandler";
import {runAppBuilderActionAddToCart} from "@AppBuilderLib/features/appbuilder/model/runAppBuilderActionAddToCart";
import {useState} from "react";
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
	const [loading, setLoading] = useState(false);
	const onClick = createActionClickHandler(
		() =>
			runAppBuilderActionAddToCart(
				{
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
					title,
				},
				{namespace},
			),
		{disabled, setLoading},
	);

	return (
		<AppBuilderActionBase
			presentation={presentation}
			label={label}
			icon={icon}
			tooltip={tooltip}
			onClick={onClick}
			loading={loading}
			disabled={disabled}
			toolbarButtonProps={toolbarButtonProps}
		/>
	);
}
