import {IAppBuilderParameterValueSourcePropsModelState} from "@AppBuilderShared/types/shapediver/appbuilder";
import {PARAMETER_TYPE} from "@shapediver/viewer.session";
import {useEffect, useRef, useState} from "react";
import {useCreateModelState} from "../../useCreateModelState";

export function useModelStateSources(props: {
	namespace: string;
	sources?: {
		source: IAppBuilderParameterValueSourcePropsModelState;
		type: PARAMETER_TYPE;
	}[];
	resetSignal?: number;
}): {
	modelStateValues: (string | undefined)[] | undefined;
} {
	const {namespace, sources, resetSignal} = props;

	const {createModelState, applyModelStateToQueryParameter} =
		useCreateModelState({namespace});

	const prevResetSignal = useRef(resetSignal);

	// reset model state values if reset signal changes
	useEffect(() => {
		if (prevResetSignal.current !== resetSignal) {
			setModelStateValues(undefined);
			prevResetSignal.current = resetSignal;
		}
	}, [resetSignal]);

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
				).then((modelState) => {
					const modelStateId = modelState?.modelStateId;
					if (!modelStateId) return undefined;
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
	};
}
