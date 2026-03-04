import {ECommerceApiSingleton} from "@AppBuilderLib/features/ecommerce/api/singleton";
import {
	IECommerceApiConnectorActions,
	IUpdateParameterValuesData,
	IUpdateParameterValuesReply,
} from "@AppBuilderLib/features/ecommerce/config/ecommerceapi";
import {validateUpdateParameterValuesData} from "@AppBuilderLib/features/ecommerce/config/ecommerceapitypecheck";
import {useShapeDiverStoreParameters} from "@AppBuilderShared/store/useShapeDiverStoreParameters";
import {useMemo} from "react";
import {useShallow} from "zustand/react/shallow";
import useAsync from "@AppBuilderLib/shared/lib/useAsync";

/**
 * Hook to set the actions for the e-commerce API connector.
 * As an example, this allows the e-commerce connector to trigger parameter
 * value updates in the App Builder app.
 */
export function useECommerceApiConnectorActions() {
	const {batchParameterValueUpdate} = useShapeDiverStoreParameters(
		useShallow((state) => ({
			batchParameterValueUpdate: state.batchParameterValueUpdate,
		})),
	);

	const actions = useMemo(() => {
		const updateParameterValues = async (
			data: IUpdateParameterValuesData,
		): Promise<IUpdateParameterValuesReply> => {
			const result = validateUpdateParameterValuesData(data);
			if (!result.success) {
				throw new Error(
					"Invalid data for updateParameterValues",
					result.error,
				);
			}

			await batchParameterValueUpdate(
				data.state,
				data.skipHistory,
				data.skipUrlUpdate,
			);

			return {};
		};

		const actions: IECommerceApiConnectorActions = {
			updateParameterValues,
		};

		return actions;
	}, [batchParameterValueUpdate]);

	useAsync(async () => {
		const api = await ECommerceApiSingleton;
		api.setApiConnectorActions(actions);
	}, [actions]);
}
