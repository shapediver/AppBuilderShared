import {ECommerceApiSingleton} from "@AppBuilderLib/features/ecommerce/api/singleton";
import {IAppBuilderParameterValueSourcePropsModelState} from "@AppBuilderShared/types/shapediver/appbuilder";
import {useEffect, useState} from "react";
import {useCreateModelState} from "@AppBuilderLib/hooks/shapediver/useCreateModelState";

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

	const {createModelState} = useCreateModelState({namespace});

	const [modelStateValues, setModelStateValues] = useState<
		(string | undefined)[] | undefined
	>(undefined);

	// load all model states
	// and only set the return values once all are loaded
	// to avoid multiple re-renders
	useEffect(() => {
		if (createModelState && sources && sources.length > 0) {
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
				promises.push(promise);
			}
			Promise.all(promises).then((results) => {
				setModelStateValues(results);
			});
		}
	}, [sources, createModelState, namespace]);

	return {
		modelStateValues,
		resetModelStateValues: () => setModelStateValues(undefined),
	};
}
