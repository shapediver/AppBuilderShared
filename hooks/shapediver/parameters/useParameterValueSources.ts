import {
	IAppBuilderParameterValueSourceDefinition,
	IAppBuilderParameterValueSourcePropsDataOutput,
	IAppBuilderParameterValueSourcePropsExport,
	IAppBuilderParameterValueSourcePropsModelState,
	IAppBuilderParameterValueSourcePropsScreenshot,
	IAppBuilderParameterValueSourcePropsSdtf,
	isDataOutputSource,
	isExportSource,
	isModelStateSource,
	isScreenshotSource,
	isSdtfSource,
} from "@AppBuilderShared/types/shapediver/appbuilder";
import {PARAMETER_TYPE} from "@shapediver/viewer.session";
import {useEffect, useMemo, useRef, useState} from "react";
import {useExportSources} from "./valueSources/useExportSources";
import {useModelStateSources} from "./valueSources/useModelStateSources";
import {useOutputDataSources} from "./valueSources/useOutputDataSources";
import {useScreenshotSources} from "./valueSources/useScreenshotSources";
import {useSdtfSources} from "./valueSources/useSdtfSources";

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
	const [sdtfSources, setSdtfSources] = useState<
		{
			source: IAppBuilderParameterValueSourcePropsSdtf;
			type: PARAMETER_TYPE;
		}[]
	>();
	const [exportSources, setExportSources] = useState<
		{
			source: IAppBuilderParameterValueSourcePropsExport;
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
		const sdTFSources: {
			source: IAppBuilderParameterValueSourcePropsSdtf;
			type: PARAMETER_TYPE;
		}[] = [];
		const exportSources: {
			source: IAppBuilderParameterValueSourcePropsExport;
			type: PARAMETER_TYPE;
		}[] = [];

		for (let i = 0; i < sources.length; i++) {
			const {source, type} = sources[i];
			console.log(source, type);
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
			} else if (isSdtfSource(source) && type.startsWith("s")) {
				sdTFSources.push({source: source.props, type});
			} else if (isExportSource(source) && type === PARAMETER_TYPE.FILE) {
				exportSources.push({source: source.props, type});
			}
		}

		sourcesRef.current = sources;
		setOutputDataValues(undefined);
		setOutputDataSources(outputDataSources);
		setScreenshotValues(undefined);
		setScreenshotSources(screenshotSources);
		setModelStateValues(undefined);
		setModelStateSources(modelStateSources);
		setSdtfValues(undefined);
		setSdtfSources(sdTFSources);
		setExportValues(undefined);
		setExportSources(exportSources);
	}, [sources]);

	// get output values
	const {outputDataValues, setOutputDataValues} = useOutputDataSources({
		namespace,
		sources: outputDataSources,
	});

	// get screenshot values
	const {screenshotValues, setScreenshotValues} = useScreenshotSources({
		namespace,
		sources: screenshotSources,
	});

	// get model state values
	const {modelStateValues, setModelStateValues} = useModelStateSources({
		namespace,
		sources: modelStateSources,
	});

	// get sdTF values
	const {sdtfValues, setSdtfValues} = useSdtfSources({
		namespace,
		sources: sdtfSources,
	});

	// get export values
	const {exportValues, setExportValues} = useExportSources({
		namespace,
		sources: exportSources,
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
				modelStateSources.length !== modelStateValues?.length) ||
			!sdtfSources ||
			(sdtfSources.length > 0 &&
				sdtfSources.length !== sdtfValues?.length) ||
			!exportSources ||
			(exportSources.length > 0 &&
				exportSources.length !== exportValues?.length)
		) {
			return;
		}

		// here we also add other source types
		// so that we can return them all together
		const sourceResults: unknown[] = [];
		let outputIndex = 0;
		let screenshotIndex = 0;
		let modelStateIndex = 0;
		let sdtfIndex = 0;
		let exportIndex = 0;

		// now loop through the original sources and map the values
		// to their respective source type
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
			} else if (isSdtfSource(source) && sdtfValues) {
				sourceResults.push(sdtfValues[sdtfIndex]);
				sdtfIndex++;
			} else if (isExportSource(source) && exportValues) {
				sourceResults.push(exportValues[exportIndex]);
				exportIndex++;
			} else {
				sourceResults.push(undefined);
			}
		}

		sourcesRef.current = undefined;
		return sourceResults;
	}, [
		outputDataValues,
		screenshotValues,
		modelStateValues,
		sdtfValues,
		exportValues,
	]);
}
