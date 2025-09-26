import {
	IAppBuilderParameterValueSourceDefinition,
	IAppBuilderParameterValueSourcePropsDataOutput,
	IAppBuilderParameterValueSourcePropsModelState,
	IAppBuilderParameterValueSourcePropsScreenshot,
	isDataOutputSource,
	isModelStateSource,
	isScreenshotSource,
} from "@AppBuilderShared/types/shapediver/appbuilder";
import {PARAMETER_TYPE} from "@shapediver/viewer.session";
import {useEffect, useMemo, useRef, useState} from "react";
import {useModelStateSource} from "./valueSources/useModelStateSource";
import {useOutputDataSources} from "./valueSources/useOutputDataSources";
import {useScreenshotSource} from "./valueSources/useScreenshotSource";

/**
 * Hook to load an array of parameter value sources and return their values in the same order.
 *
 * @param props
 * @returns
 */
export function useParameterValueSources(props?: {
	namespace: string;
	sources: {
		source: IAppBuilderParameterValueSourceDefinition;
		type: PARAMETER_TYPE;
	}[];
}): unknown[] | undefined {
	// default to empty values if no props are given
	// this avoids issues with useMemo and useOutputValueSources
	const {namespace, sources} = props ?? {
		namespace: "",
		sources: [],
	};
	const sourcesRef = useRef<
		| {
				source: IAppBuilderParameterValueSourceDefinition;
				type: PARAMETER_TYPE;
		  }[]
		| undefined
	>(sources);

	const [outputDataSources, setOutputDataSources] = useState<
		{
			source: IAppBuilderParameterValueSourcePropsDataOutput;
			type: PARAMETER_TYPE;
		}[]
	>();
	const [screenshotSources, setScreenshotSources] = useState<
		{
			source: IAppBuilderParameterValueSourcePropsScreenshot;
			type: PARAMETER_TYPE;
		}[]
	>();
	const [modelStateSources, setModelStateSources] = useState<
		{
			source: IAppBuilderParameterValueSourcePropsModelState;
			type: PARAMETER_TYPE;
		}[]
	>();

	// separate sources by type and call their respective hooks
	useEffect(() => {
		if (!sources || sources.length === 0) {
			sourcesRef.current = undefined;
			return;
		}

		const outputDataSources: {
			source: IAppBuilderParameterValueSourcePropsDataOutput;
			type: PARAMETER_TYPE;
		}[] = [];
		const screenshotSources: {
			source: IAppBuilderParameterValueSourcePropsScreenshot;
			type: PARAMETER_TYPE;
		}[] = [];
		const modelStateSources: {
			source: IAppBuilderParameterValueSourcePropsModelState;
			type: PARAMETER_TYPE;
		}[] = [];

		for (let i = 0; i < sources.length; i++) {
			const {source, type} = sources[i];
			if (
				isDataOutputSource(source) &&
				(type === PARAMETER_TYPE.STRING || type === PARAMETER_TYPE.FILE)
			) {
				outputDataSources.push({source: source.props, type});
			} else if (
				isScreenshotSource(source) &&
				type === PARAMETER_TYPE.FILE
			) {
				screenshotSources.push({source: source.props, type});
			} else if (
				isModelStateSource(source) &&
				type === PARAMETER_TYPE.STRING
			) {
				modelStateSources.push({source: source.props, type});
			}
		}

		sourcesRef.current = sources;
		setOutputDataValues(undefined);
		setOutputDataSources(outputDataSources);
		setScreenshotValues(undefined);
		setScreenshotSources(screenshotSources);
		setModelStateValues(undefined);
		setModelStateSources(modelStateSources);
	}, [sources]);

	// get output values
	const {outputDataValues, setOutputDataValues} = useOutputDataSources({
		namespace,
		sources: outputDataSources,
	});

	// get screenshot values
	const {screenshotValues, setScreenshotValues} = useScreenshotSource({
		namespace,
		sources: screenshotSources,
	});

	// get model state values
	const {modelStateValues, setModelStateValues} = useModelStateSource({
		namespace,
		sources: modelStateSources,
	});

	// map output values to their source names
	// and create an array of results in the same order as sources
	return useMemo(() => {
		if (!sourcesRef.current) return;

		// first, we need to check if ALL sources have been loaded
		// we cannot return partial results
		if (
			!outputDataSources ||
			(outputDataSources.length > 0 &&
				outputDataSources.length !== outputDataValues?.length) ||
			!screenshotSources ||
			(screenshotSources.length > 0 &&
				screenshotSources.length !== screenshotValues?.length) ||
			!modelStateSources ||
			(modelStateSources.length > 0 &&
				modelStateSources.length !== modelStateValues?.length)
		) {
			return;
		}

		// here we also add other source types
		// so that we can return them all together
		const sourceResults: unknown[] = [];
		let outputIndex = 0;
		let screenshotIndex = 0;
		let modelStateIndex = 0;

		for (let i = 0; i < sourcesRef.current.length; i++) {
			const {source} = sourcesRef.current[i];
			if (isDataOutputSource(source) && outputDataValues) {
				sourceResults.push(outputDataValues[outputIndex]);
				outputIndex++;
			} else if (isScreenshotSource(source) && screenshotValues) {
				sourceResults.push(screenshotValues[screenshotIndex]);
				screenshotIndex++;
			} else if (isModelStateSource(source) && modelStateValues) {
				sourceResults.push(modelStateValues[modelStateIndex]);
				modelStateIndex++;
			} else {
				sourceResults.push(undefined);
			}
		}

		sourcesRef.current = undefined;
		return sourceResults;
	}, [outputDataValues, screenshotValues, modelStateValues]);
}
