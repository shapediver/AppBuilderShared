import {ECommerceApiSingleton} from "@AppBuilderShared/modules/ecommerce/singleton";
import {useShapeDiverStoreProcessManager} from "@AppBuilderShared/store/useShapeDiverStoreProcessManager";
import {IAppBuilderParameterValueSourcePropsModelState} from "@AppBuilderShared/types/shapediver/appbuilder";
import {useEffect, useState} from "react";
import {useCreateModelState} from "../../useCreateModelState";

export function useModelStateSources(props: {
	namespace: string;
	sources?: {
		source: IAppBuilderParameterValueSourcePropsModelState;
	}[];
}): {
	modelStateValues: (string | undefined)[] | undefined;
	resetModelStateValues: () => void;
} {
	const {namespace, sources} = props;

	const {createProcessManager, addProcess} = useShapeDiverStoreProcessManager(
		(state) => ({
			createProcessManager: state.createProcessManager,
			addProcess: state.addProcess,
		}),
	);

	const {createModelState} = useCreateModelState({namespace});

	const [modelStateValues, setModelStateValues] = useState<
		(string | undefined)[] | undefined
	>(undefined);

	// load all model states
	// and only set the return values once all are loaded
	// to avoid multiple re-renders
	useEffect(() => {
		if (createModelState && sources && sources.length > 0) {
			// Create a process manager for model state resolution
			const processManagerId = createProcessManager(namespace);

			const promises = [];
			for (let i = 0; i < sources.length; i++) {
				const {source} = sources[i];
				const {
					updateUrl = false,
					includeImage,
					image,
					includeGltf,
					parameterNamesToInclude,
					parameterNamesToExclude,
				} = source;

				const promise = createModelState(
					parameterNamesToInclude,
					parameterNamesToExclude,
					includeImage,
					image,
					undefined,
					includeGltf,
				).then(async ({modelStateId}) => {
					if (!modelStateId) return;
					// in case we are not running inside an iframe, the instance of
					// IEcommerceApi is a dummy implementation
					const api = await ECommerceApiSingleton;
					const {href} = await api.updateSharingLink({
						modelStateId,
						updateUrl,
					});
					return href.toString();
				});
				// Register this model state creation as a process
				addProcess(processManagerId, {
					id: `modelstate-${i}`,
					name: `Model State ${i + 1}`,
					promise: promise,
				});
				promises.push(promise);
			}
			Promise.all(promises).then((results) => {
				setModelStateValues(results);
			});
		}
	}, [sources, createModelState, namespace, createProcessManager, addProcess]);

	return {
		modelStateValues,
		resetModelStateValues: () => setModelStateValues(undefined),
	};
}
