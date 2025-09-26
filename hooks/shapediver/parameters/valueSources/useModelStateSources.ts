import {ECommerceApiSingleton} from "@AppBuilderShared/modules/ecommerce/singleton";
import {IAppBuilderParameterValueSourcePropsModelState} from "@AppBuilderShared/types/shapediver/appbuilder";
import {PARAMETER_TYPE} from "@shapediver/viewer.session";
import {useEffect, useState} from "react";
import {useCreateModelState} from "../../useCreateModelState";

export function useModelStateSources(props: {
	namespace: string;
	sources?: {
		source: IAppBuilderParameterValueSourcePropsModelState;
		type: PARAMETER_TYPE;
	}[];
}): {
	modelStateValues: (string | undefined)[] | undefined;
	setModelStateValues: React.Dispatch<
		React.SetStateAction<(string | undefined)[] | undefined>
	>;
} {
	// default to empty values if no props are given
	const {namespace, sources} = props ?? {
		namespace: "",
		sources: [],
	};

	const {createModelState, applyModelStateToQueryParameter} =
		useCreateModelState({namespace});

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
					updateUrl,
					includeImage,
					// image, // TODO use image defined by export of href
					includeGltf,
					parameterNamesToInclude,
					parameterNamesToExclude,
				} = source;

				const promise = createModelState(
					parameterNamesToInclude,
					parameterNamesToExclude,
					includeImage,
					undefined,
					includeGltf,
				).then(({modelStateId, screenshot}) => {
					if (!modelStateId) return undefined;

					const url = applyModelStateToQueryParameter(modelStateId);

					if (updateUrl) {
						ECommerceApiSingleton.then(async (api) => {
							api.updateSharingLink({
								modelStateId,
								imageUrl: screenshot,
							});
						});
					}

					return url.toString();
				});
				promises.push(promise);
			}
			Promise.all(promises).then((results) => {
				setModelStateValues(results);
			});
		}
	}, [sources]);

	return {
		modelStateValues,
		setModelStateValues,
	};
}
