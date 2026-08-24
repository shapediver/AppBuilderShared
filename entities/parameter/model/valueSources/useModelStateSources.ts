import {IAppBuilderParameterValueSourcePropsModelState} from "@AppBuilderLib/features/appbuilder/config/appbuilder";
import {ECommerceApiSingleton} from "@AppBuilderLib/features/ecommerce/api/singleton";
import {useCreateModelState} from "@AppBuilderLib/features/model-state/model/useCreateModelState";
import {Logger} from "@AppBuilderLib/shared/lib/logger";
import {useEffect, useState} from "react";

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
					screenshotProps,
					parameterNamesToInclude,
					parameterNamesToExclude,
				} = source;

				const promise = createModelState(
					{
						parameterNamesToInclude,
						parameterNamesToExclude,
						includeImage,
						image,
						screenshotProps,
						data: undefined,
						includeGltf,
					},
					// value-source model states are generated, not user saves;
					// do not clear the unsaved changes flag
					{markSaved: false},
				)
					.then(async ({modelStateId}) => {
						if (!modelStateId) return;
						// in case we are not running inside an iframe, the instance of
						// IEcommerceApi is a dummy implementation
						const api = await ECommerceApiSingleton;
						const {href} = await api.updateSharingLink({
							modelStateId,
							updateUrl,
						});
						return href.toString();
					})
					.catch((error) => {
						Logger.warn(
							"Could not resolve model state parameter value source.",
							error,
						);
						return undefined;
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
