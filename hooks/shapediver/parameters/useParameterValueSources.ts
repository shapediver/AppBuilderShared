import {
	IAppBuilderParameterValueSourceDefinition,
	IAppBuilderParameterValueSourcePropsDataOutput,
	IAppBuilderParameterValueSourcePropsScreenshot,
	isDataOutputSource,
	isScreenshotSource,
} from "@AppBuilderShared/types/shapediver/appbuilder";
import {useEffect, useMemo, useRef, useState} from "react";
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
	sources: IAppBuilderParameterValueSourceDefinition[];
}): unknown[] | undefined {
	// default to empty values if no props are given
	// this avoids issues with useMemo and useOutputValueSources
	const {namespace, sources} = props ?? {
		namespace: "",
		sources: [],
	};
	const sourcesRef = useRef<
		IAppBuilderParameterValueSourceDefinition[] | undefined
	>(sources);

	const [outputDataSources, setOutputDataSources] =
		useState<IAppBuilderParameterValueSourcePropsDataOutput[]>();
	const [screenshotSources, setScreenshotSources] =
		useState<IAppBuilderParameterValueSourcePropsScreenshot[]>();

	// separate sources by type and call their respective hooks
	useEffect(() => {
		if (!sources || sources.length === 0) {
			sourcesRef.current = undefined;
			return;
		}

		const outputDataSources: IAppBuilderParameterValueSourcePropsDataOutput[] =
			[];
		const screenshotSources: IAppBuilderParameterValueSourcePropsScreenshot[] =
			[];

		for (let i = 0; i < sources.length; i++) {
			const source = sources[i];
			if (isDataOutputSource(source)) {
				outputDataSources.push(source.props);
			} else if (isScreenshotSource(source)) {
				screenshotSources.push(source.props);
			}
		}

		sourcesRef.current = sources;
		setOutputDataValues(undefined);
		setOutputDataSources(outputDataSources);
		setScreenshotValues(undefined);
		setScreenshotSources(screenshotSources);
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
				screenshotSources.length !== screenshotValues?.length)
		) {
			return;
		}

		// here we also add other source types
		// so that we can return them all together
		const sourceResults: unknown[] = [];
		let outputIndex = 0;
		let screenshotIndex = 0;

		for (let i = 0; i < sourcesRef.current.length; i++) {
			const source = sourcesRef.current[i];
			if (isDataOutputSource(source) && outputDataValues) {
				sourceResults.push(outputDataValues[outputIndex]);
				outputIndex++;
			} else if (isScreenshotSource(source) && screenshotValues) {
				sourceResults.push(screenshotValues[screenshotIndex]);
				screenshotIndex++;
			} else {
				sourceResults.push(undefined);
			}
		}

		sourcesRef.current = undefined;
		return sourceResults;
	}, [outputDataValues, screenshotValues]);
}
