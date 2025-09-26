import {
	IAppBuilderParameterValueSourceDefinition,
	IAppBuilderParameterValueSourcePropsDataOutput,
	IAppBuilderParameterValueSourcePropsScreenshot,
} from "@AppBuilderShared/types/shapediver/appbuilder";
import {useEffect, useMemo, useRef, useState} from "react";
import {useOutputValueSources} from "./valueSources/useOutputValueSources";
import {useScreenshot} from "./valueSources/useScreenshot";

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

	const [outputSources, setOutputSources] =
		useState<IAppBuilderParameterValueSourcePropsDataOutput[]>();
	const [screenshotSources, setScreenshotSources] =
		useState<IAppBuilderParameterValueSourcePropsScreenshot[]>();

	// separate sources by type and call their respective hooks
	useEffect(() => {
		if (!sources || sources.length === 0) {
			sourcesRef.current = undefined;
			return;
		}

		const outputSources: IAppBuilderParameterValueSourcePropsDataOutput[] =
			[];
		const screenshotSources: IAppBuilderParameterValueSourcePropsScreenshot[] =
			[];

		for (let i = 0; i < sources.length; i++) {
			const source = sources[i];
			if (source.type === "dataOutput") {
				outputSources.push(
					source.props as IAppBuilderParameterValueSourcePropsDataOutput,
				);
			} else if (source.type === "screenshot") {
				screenshotSources.push(
					source.props as IAppBuilderParameterValueSourcePropsScreenshot,
				);
			}
		}

		sourcesRef.current = sources;
		setOutputValues(undefined);
		setOutputSources(outputSources);
		setScreenshots(undefined);
		setScreenshotSources(screenshotSources);
	}, [sources]);

	// get output values
	const {outputValues, setOutputValues} = useOutputValueSources({
		namespace,
		sources: outputSources,
	});

	// get screenshot values
	const {screenshots, setScreenshots} = useScreenshot({
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
			!outputSources ||
			(outputSources.length > 0 &&
				outputSources.length !== outputValues?.length) ||
			!screenshotSources ||
			(screenshotSources.length > 0 &&
				screenshotSources.length !== screenshots?.length)
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
			if (source.type === "dataOutput" && outputValues) {
				sourceResults.push(outputValues[outputIndex]);
				outputIndex++;
			} else if (source.type === "screenshot" && screenshots) {
				sourceResults.push(screenshots[screenshotIndex]);
				screenshotIndex++;
			} else {
				sourceResults.push(undefined);
			}
		}

		sourcesRef.current = undefined;
		return sourceResults;
	}, [outputValues, screenshots]);
}
