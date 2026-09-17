import {ComponentContext} from "@AppBuilderLib/features/appbuilder/config/ComponentContext";
import {ECommerceApiSingleton} from "@AppBuilderLib/features/ecommerce/api/singleton";
import {createECommerceApiConnectorActions} from "@AppBuilderLib/features/ecommerce/model/createECommerceApiConnectorActions";
import useAsync from "@AppBuilderLib/shared/lib/useAsync";
import {useContext, useMemo} from "react";

interface Props {
	namespace: string;
}

/**
 * Register store-backed e-commerce connector actions (no action hooks).
 */
export function useECommerceApiConnectorActions({namespace}: Props) {
	const {actions: hostActions} = useContext(ComponentContext);
	const actions = useMemo(
		() => createECommerceApiConnectorActions(namespace, hostActions),
		[namespace, hostActions],
	);

	useAsync(async () => {
		const api = await ECommerceApiSingleton;
		api.setApiConnectorActions(actions);
	}, [actions]);
}
