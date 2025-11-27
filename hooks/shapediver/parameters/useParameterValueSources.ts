import {useShapeDiverStoreSession} from "@AppBuilderShared/store/useShapeDiverStoreSession";
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
import {Logger} from "@AppBuilderShared/utils/logger";
import {IFileParameterApi, PARAMETER_TYPE} from "@shapediver/viewer.session";
import {useCallback, useEffect, useMemo, useRef, useState} from "react";
import {useExportSources} from "./valueSources/useExportSources";
import {useModelStateSources} from "./valueSources/useModelStateSources";
import {useOutputDataSources} from "./valueSources/useOutputDataSources";
import {useScreenshotSources} from "./valueSources/useScreenshotSources";
import {useSdtfSources} from "./valueSources/useSdtfSources";

type ParameterValueSourcesByType = {
	outputData: {
		source: IAppBuilderParameterValueSourcePropsDataOutput;
		upload?: (file: File) => Promise<string>;
	}[];
	screenshot: {
		source: IAppBuilderParameterValueSourcePropsScreenshot;
		upload: (file: File) => Promise<string>;
	}[];
	modelState: {
		source: IAppBuilderParameterValueSourcePropsModelState;
	}[];
	sdtf: {
		source: IAppBuilderParameterValueSourcePropsSdtf;
	}[];
	export: {
		source: IAppBuilderParameterValueSourcePropsExport;
		upload: (file: File) => Promise<string>;
	}[];
};

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
		parameterId: string;
		// if a different namespace should be used for the parameter
		// this allows to set different namespaces for different parameters in the sources
		// if not set, the main namespace will be used
		parameterNamespace?: string;
	}[];
}): unknown[] | undefined {
	// default to empty values if no props are given
	// this avoids issues with useMemo and useOutputValueSources
	const {namespace, sources} = props ?? {
		namespace: "",
		sources: [],
	};

	const sessions = useShapeDiverStoreSession((state) => {
		return state.sessions;
	});

	const sessionsRef = useRef(sessions);
	useEffect(() => {
		sessionsRef.current = sessions;
	}, [sessions]);

	const sourcesRef = useRef<
		| {
				source: IAppBuilderParameterValueSourceDefinition;
				parameterId: string;
		  }[]
		| undefined
	>(sources);

	const [sourcesByType, setSourcesByType] = useState<
		ParameterValueSourcesByType | undefined
	>();

	// separate sources by type and call their respective hooks
	useEffect(() => {
		if (!sessionsRef.current) return;

		if (!sources || sources.length === 0) {
			sourcesRef.current = undefined;
			return;
		}

		const approvedSources = [];
		const sourcesByType: ParameterValueSourcesByType = {
			outputData: [],
			screenshot: [],
			modelState: [],
			sdtf: [],
			export: [],
		};

		for (let i = 0; i < sources.length; i++) {
			const {source, parameterId, parameterNamespace} = sources[i];

			// get the session for the source
			// if no namespace is given for the source, use the main namespace
			const session =
				sessionsRef.current[parameterNamespace || namespace];

			if (!session) continue;

			const parameter = Object.values(session.parameters).find(
				(p) =>
					p.id === parameterId ||
					p.name === parameterId ||
					p.displayname === parameterId,
			);
			if (!parameter) continue;
			const type = parameter.type;

			if (isDataOutputSource(source)) {
				if (
					type === PARAMETER_TYPE.STRING ||
					type === PARAMETER_TYPE.FILE
				) {
					const upload =
						type === PARAMETER_TYPE.FILE
							? (parameter as IFileParameterApi).upload.bind(
									parameter,
								)
							: undefined;
					sourcesByType.outputData.push({
						source: source.props,
						upload,
					});
					approvedSources.push(sources[i]);
				} else {
					Logger.warn(
						`Data output source parameter has invalid type ${type}. Only STRING and FILE are supported.`,
					);
				}
			} else if (isScreenshotSource(source)) {
				if (type === PARAMETER_TYPE.FILE) {
					sourcesByType.screenshot.push({
						source: source.props,
						upload: (parameter as IFileParameterApi).upload.bind(
							parameter,
						),
					});
					approvedSources.push(sources[i]);
				} else {
					Logger.warn(
						`Screenshot source parameter has invalid type ${type}. Only FILE is supported.`,
					);
				}
			} else if (isModelStateSource(source)) {
				if (type === PARAMETER_TYPE.STRING) {
					sourcesByType.modelState.push({source: source.props});
					approvedSources.push(sources[i]);
				} else {
					Logger.warn(
						`Model state source parameter has invalid type ${type}. Only STRING is supported.`,
					);
				}
			} else if (isSdtfSource(source)) {
				if (type.startsWith("s")) {
					sourcesByType.sdtf.push({source: source.props});
					approvedSources.push(sources[i]);
				} else {
					Logger.warn(
						`sdTF source parameter has invalid type ${type}. Only s-type parameters are supported.`,
					);
				}
			} else if (isExportSource(source)) {
				if (type === PARAMETER_TYPE.FILE) {
					sourcesByType.export.push({
						source: source.props,
						upload: (parameter as IFileParameterApi).upload.bind(
							parameter,
						),
					});
					approvedSources.push(sources[i]);
				} else {
					Logger.warn(
						`Export source parameter has invalid type ${type}. Only FILE is supported.`,
					);
				}
			}
		}

		sourcesRef.current = approvedSources;
		// set the reset signal so that the individual hooks can reset their state
		resetValues();
		setSourcesByType(sourcesByType);
	}, [sources]);

	// get output values
	const {outputDataValues, resetOutputDataValues} = useOutputDataSources({
		namespace,
		sources: sourcesByType?.outputData,
	});

	// get screenshot values
	const {screenshotValues, resetScreenshotValues} = useScreenshotSources({
		namespace,
		sources: sourcesByType?.screenshot,
	});

	// get model state values
	const {modelStateValues, resetModelStateValues} = useModelStateSources({
		namespace,
		sources: sourcesByType?.modelState,
	});

	// get sdTF values
	const {sdtfValues, resetSdtfValues} = useSdtfSources({
		namespace,
		sources: sourcesByType?.sdtf,
	});

	// get export values
	const {exportValues, resetExportValues} = useExportSources({
		namespace,
		sources: sourcesByType?.export,
	});

	const resetValues = useCallback(() => {
		resetOutputDataValues();
		resetScreenshotValues();
		resetModelStateValues();
		resetSdtfValues();
		resetExportValues();
	}, [
		resetOutputDataValues,
		resetScreenshotValues,
		resetModelStateValues,
		resetSdtfValues,
		resetExportValues,
	]);

	// check if all values are loaded
	// if one of the values is not loaded, we return undefined
	// this avoids returning partial results
	const loadedValues = useMemo(() => {
		if (!sourcesRef.current) return;
		// check if sourcesByType is defined
		if (!sourcesByType) return;

		// gather all loaded values
		const currentlyLoadedValues = {
			outputData: outputDataValues,
			screenshot: screenshotValues,
			modelState: modelStateValues,
			sdtf: sdtfValues,
			export: exportValues,
		};

		// check for each value if it is loaded
		// the number of values must match the number of sources for each type
		// if one of them is not loaded, we return undefined
		for (const key in currentlyLoadedValues) {
			const typedKey = key as keyof typeof currentlyLoadedValues;
			const value = currentlyLoadedValues[typedKey];
			const source = sourcesByType[typedKey];
			// if the number of values does not match the number of sources, we are not loaded
			if (source && source.length > 0 && source.length !== value?.length)
				return;
		}

		return currentlyLoadedValues;
	}, [
		sourcesByType,
		outputDataValues,
		screenshotValues,
		modelStateValues,
		sdtfValues,
		exportValues,
	]);

	// map output values to their source names
	// and create an array of results in the same order as sources
	return useMemo(() => {
		if (!sourcesRef.current) return;

		// first, we need to check if ALL sources have been loaded
		// we cannot return partial results
		if (!loadedValues) return;

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
			if (isDataOutputSource(source)) {
				sourceResults.push(loadedValues.outputData?.[outputIndex++]);
			} else if (isScreenshotSource(source)) {
				sourceResults.push(
					loadedValues.screenshot?.[screenshotIndex++],
				);
			} else if (isModelStateSource(source)) {
				sourceResults.push(
					loadedValues.modelState?.[modelStateIndex++],
				);
			} else if (isSdtfSource(source)) {
				sourceResults.push(loadedValues.sdtf?.[sdtfIndex++]);
			} else if (isExportSource(source)) {
				sourceResults.push(loadedValues.export?.[exportIndex++]);
			} else {
				sourceResults.push(undefined);
			}
		}

		sourcesRef.current = undefined;
		return sourceResults;
	}, [loadedValues]);
}
