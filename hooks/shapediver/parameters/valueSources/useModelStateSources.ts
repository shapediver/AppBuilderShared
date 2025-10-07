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
				).then(({modelStateId}) => {
					if (!modelStateId) return;
					return applyModelStateToQueryParameter(
						modelStateId,
						updateUrl,
					).toString();
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
		resetModelStateValues: () => setModelStateValues(undefined),
	};
}
