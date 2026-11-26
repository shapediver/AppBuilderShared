import {IShapeDiverOutput} from "@AppBuilderLib/entities/output/config/output";
import {PropsOutput} from "@AppBuilderLib/entities/output/config/propsOutput";
import {useOutputs} from "@AppBuilderLib/entities/output/model/useOutputs";
import {
	createSdtfUploadCache,
	formatSdtfParameterValue,
	SdtfUploadSession,
} from "@AppBuilderLib/entities/parameter/lib/uploadSdtfAsset";
import {useShapeDiverStoreSession} from "@AppBuilderLib/entities/session/model/useShapeDiverStoreSession";
import {IAppBuilderParameterValueSourcePropsSdtf} from "@AppBuilderLib/features/appbuilder/config/appbuilder";
import {Logger} from "@AppBuilderLib/shared/lib/logger";
import {useShapeDiverStoreProcessManager} from "@AppBuilderLib/shared/model/useShapeDiverStoreProcessManager";
import {useEffect, useMemo, useState} from "react";
import {useShallow} from "zustand/react/shallow";

export function useSdtfSources(props: {
	namespace: string;
	sources?: {
		source: IAppBuilderParameterValueSourcePropsSdtf;
		/**
		 * Namespace of the session owning the target parameter.
		 * The sdTF asset must be uploaded to this session, as assets are scoped per session.
		 * Defaults to the main namespace.
		 */
		namespace?: string;
	}[];
}): {
	sdtfValues: (string | undefined)[] | undefined;
	resetSdtfValues: () => void;
} {
	const {namespace, sources} = props;

	// use a shallow selector, otherwise every update of the process manager
	// store re-renders this hook and re-runs the effect below
	const {createProcessManager, addProcess} = useShapeDiverStoreProcessManager(
		useShallow((state) => ({
			createProcessManager: state.createProcessManager,
			addProcess: state.addProcess,
		})),
	);

	const [sdtfValues, setSdtfValues] = useState<
		(string | undefined)[] | undefined
	>(undefined);

	// create output map from sources
	const outputMap: PropsOutput[] = useMemo(() => {
		if (!sources) return [];
		return sources
			.map(({source}) => {
				const {sessionId, name} = source;
				if (!namespace && !sessionId) return;

				return {
					namespace: sessionId || namespace,
					outputId: name,
				};
			})
			.filter((e): e is PropsOutput => !!e);
	}, [namespace, sources]);

	// get all outputs
	const outputs: (IShapeDiverOutput | undefined)[] = useOutputs(outputMap);

	// Upload sessions only. Selecting the full sessions map would re-run the
	// upload effect on unrelated session store updates.
	const uploadSessions = useShapeDiverStoreSession(
		useShallow((state) => {
			const selected: Record<string, SdtfUploadSession | undefined> = {};
			if (!sources) return selected;
			for (const entry of sources) {
				const targetNamespace = entry.namespace || namespace;
				if (!(targetNamespace in selected)) {
					selected[targetNamespace] = state.sessions[targetNamespace];
				}
			}
			return selected;
		}),
	);

	// create a combined array of outputs and their types
	const outputResults:
		| {
				output: IShapeDiverOutput | undefined;
				source: IAppBuilderParameterValueSourcePropsSdtf | undefined;
				targetNamespace: string;
		  }[]
		| undefined = useMemo(() => {
		if (!outputs || !sources) return undefined;
		return outputs.map((output, index) => ({
			output,
			source: sources[index]?.source,
			targetNamespace: sources[index]?.namespace || namespace,
		}));
	}, [outputs, sources, namespace]);

	// load all outputs
	// and only set the return values once all are loaded
	// to avoid multiple re-renders
	useEffect(() => {
		if (!outputResults || outputResults.length === 0) return;

		let cancelled = false;
		// Process manager for sdTF resolution, created lazily
		// only if there is at least one upload to wait for
		let processManagerId: string | undefined;
		const uploadCache = createSdtfUploadCache();

		const promises = [];

		for (let i = 0; i < outputResults.length; i++) {
			const {output, source, targetNamespace} = outputResults[i];
			if (!source) {
				promises.push(Promise.resolve(undefined));
				continue;
			}

			const {name, chunk} = source;

			// the sdTF asset must be uploaded to the session owning the target parameter,
			// as uploaded assets are scoped per session
			const session = uploadSessions[targetNamespace];

			if (!session) {
				Logger.warn(
					`Session with namespace "${targetNamespace}" not found for sdTF parameter value source "${name}".`,
				);
				promises.push(Promise.resolve(undefined));
			} else if (!output) {
				Logger.warn(`sdTF output with name ${name} not found. `);
				promises.push(Promise.resolve(undefined));
			} else if (output.content === undefined) {
				Logger.warn(`sdTF output with name ${name} has no content.`);
				promises.push(Promise.resolve(undefined));
			} else if (output.content?.[0]?.href) {
				const url = output.content[0].href;
				const assetDefinition = uploadCache
					.uploadAsset({
						uploadNamespace: targetNamespace,
						url,
						session,
						onUploadStart: (upload, uploadKey) => {
							if (processManagerId === undefined)
								processManagerId =
									createProcessManager(namespace);
							addProcess(processManagerId, {
								id: `sdtf-${uploadKey}`,
								name: `sdTF: ${name}`,
								promise: upload,
							});
						},
					})
					.then((assetId) => {
						if (!assetId) return undefined;
						return formatSdtfParameterValue(assetId, chunk);
					});
				promises.push(assetDefinition);
			} else {
				Logger.warn(
					`sdTF output with name ${name} has no content href.`,
				);
				promises.push(Promise.resolve(undefined));
			}
		}

		Promise.all(promises)
			.then((res) => {
				if (!cancelled) setSdtfValues(res);
			})
			.catch((error) => {
				Logger.warn(
					"Could not resolve sdTF parameter value source.",
					error,
				);
				if (!cancelled)
					setSdtfValues(outputResults.map(() => undefined));
			});

		return () => {
			cancelled = true;
		};
	}, [
		outputResults,
		uploadSessions,
		namespace,
		createProcessManager,
		addProcess,
	]);

	return {sdtfValues, resetSdtfValues: () => setSdtfValues(undefined)};
}
