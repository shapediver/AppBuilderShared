import {useShapeDiverStoreParameters} from "@AppBuilderLib/entities/parameter/model/useShapeDiverStoreParameters";
import {ECommerceApiSingleton} from "@AppBuilderLib/features/ecommerce/api/singleton";
import {
	IECommerceApiConnectorActions,
	IUpdateParameterValuesData,
	IUpdateParameterValuesReply,
} from "@AppBuilderLib/features/ecommerce/config/ecommerceapi";
import {
	validateCreateModelStateData,
	validateImportModelStateData,
	validateUpdateParameterValuesData,
} from "@AppBuilderLib/features/ecommerce/config/ecommerceapitypecheck";
import useAsync from "@AppBuilderLib/shared/lib/useAsync";
import {useCreateModelState} from "@AppBuilderShared/features/model-state/model/useCreateModelState";
import {useImportModelState} from "@AppBuilderShared/features/model-state/model/useImportModelState";
import {useMemo} from "react";
import {useShallow} from "zustand/react/shallow";

interface Props {
	namespace: string;
}

/**
 * Hook to set the actions for the e-commerce API connector.
 * As an example, this allows the e-commerce connector to trigger parameter
 * value updates in the App Builder app.
 */
export function useECommerceApiConnectorActions({namespace}: Props) {
	const {batchParameterValueUpdate} = useShapeDiverStoreParameters(
		useShallow((state) => ({
			batchParameterValueUpdate: state.batchParameterValueUpdate,
		})),
	);

	const {createModelState} = useCreateModelState({namespace});
	const {importModelState} = useImportModelState({namespace});

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

		const wrappedCreateModelState: IECommerceApiConnectorActions["createModelState"] =
			async (data) => {
				const result = validateCreateModelStateData(data);
				if (!result.success) {
					throw new Error(
						"Invalid data for createModelState",
						result.error,
					);
				}
				return createModelState(data);
			};

		const wrappedImportModelState: IECommerceApiConnectorActions["importModelState"] =
			async (data) => {
				const result = validateImportModelStateData(data);
				if (!result.success) {
					throw new Error(
						"Invalid data for importModelState",
						result.error,
					);
				}
				return importModelState(data);
			};

		const actions: IECommerceApiConnectorActions = {
			updateParameterValues,
			createModelState: wrappedCreateModelState,
			importModelState: wrappedImportModelState,
		};

		return actions;
	}, [batchParameterValueUpdate, createModelState, importModelState]);

	useAsync(async () => {
		const api = await ECommerceApiSingleton;
		api.setApiConnectorActions(actions);
	}, [actions]);
}
