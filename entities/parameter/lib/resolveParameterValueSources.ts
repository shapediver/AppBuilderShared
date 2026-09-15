import type {ParameterValueDefinition} from "@AppBuilderLib/entities/parameter/model/useResolveParameterValues";
import {useShapeDiverStoreParameters} from "@AppBuilderLib/entities/parameter/model/useShapeDiverStoreParameters";
import {useShapeDiverStoreSession} from "@AppBuilderLib/entities/session/model/useShapeDiverStoreSession";
import {useShapeDiverStoreViewportAccessFunctions} from "@AppBuilderLib/entities/viewport/model/useShapeDiverStoreViewportAccessFunctions";
import {
	IAppBuilderParameterValueDefinition,
	IAppBuilderParameterValueSourceDefinition,
	IAppBuilderParameterValueSourcePropsDataOutput,
	IAppBuilderParameterValueSourcePropsExport,
	IAppBuilderParameterValueSourcePropsModelState,
	IAppBuilderParameterValueSourcePropsScreenshot,
	IAppBuilderParameterValueSourcePropsSdtf,
	isDataOutputSource,
	isExportSource,
	isModelStateSource,
	isParameterSource,
	isScreenshotSource,
	isSdtfSource,
} from "@AppBuilderLib/features/appbuilder/config/appbuilder";
import {ECommerceApiSingleton} from "@AppBuilderLib/features/ecommerce/api/singleton";
import {createModelStateCore} from "@AppBuilderLib/features/model-state/lib/createModelStateCore";
import {getCreateModelStateThemeDefaults} from "@AppBuilderLib/features/model-state/model/createModelStateThemeDefaults";
import {Logger} from "@AppBuilderLib/shared/lib/logger";
import {useShapeDiverStoreProcessManager} from "@AppBuilderLib/shared/model/useShapeDiverStoreProcessManager";
import {
	ResAssetDefinition,
	ResExport,
	ResStypeParameter,
} from "@shapediver/sdk.geometry-api-sdk-v2";
import {
	Converter,
	EXPORT_TYPE,
	IFileParameterApi,
	IParameterApi,
	PARAMETER_TYPE,
} from "@shapediver/viewer.session";
import {guessMissingMimeType} from "@shapediver/viewer.utils.mime-type";

export type ResolveParameterValueSourcesContext = {
	namespace: string;
	viewportId?: string;
};

type OutputSnapshot = {
	definition: {id: string; version?: string};
	content?: Array<{href?: string}>;
};

type SourceEntry = {
	index: number;
	source: IAppBuilderParameterValueSourceDefinition;
	id: string;
	namespace?: string;
	nestedSourceKeys?: Map<string, string>;
};

const createSourceKey = (source: IAppBuilderParameterValueSourceDefinition) =>
	`${source.type + ""}|${JSON.stringify(source.props)}`;

function addSourceToFlatMap(
	parameterInfo: ParameterValueDefinition,
	map: Map<string, SourceEntry>,
	resolving: WeakSet<IAppBuilderParameterValueSourceDefinition>,
	resolved: WeakSet<IAppBuilderParameterValueSourceDefinition>,
) {
	const {id, value, namespace} = parameterInfo;

	if (
		typeof value !== "object" ||
		value === null ||
		!isParameterSource(value)
	)
		return;

	if (resolving.has(value)) {
		Logger.warn(
			`Cycle detected while flattening Parameter Value Sources. Source with id '${id}' is already being resolved higher up in the call stack.`,
		);
		return;
	}
	if (resolved.has(value)) return;

	resolving.add(value);

	const nested = isExportSource(value) && value.props.parameterValues;
	const nestedSourceKeys = new Map<string, string>();

	if (nested) {
		const nestedNamespace =
			isExportSource(value) && value.props.sessionId
				? value.props.sessionId
				: namespace;

		for (const [childKey, child] of Object.entries(nested)) {
			if (
				typeof child === "object" &&
				child !== null &&
				isParameterSource(child)
			) {
				nestedSourceKeys.set(childKey, createSourceKey(child));
			}

			addSourceToFlatMap(
				{id: childKey, value: child, namespace: nestedNamespace},
				map,
				resolving,
				resolved,
			);
		}
	}

	const key = createSourceKey(value);
	if (!map.has(key)) {
		map.set(key, {
			index: map.size,
			source: value,
			id,
			namespace,
			nestedSourceKeys:
				nestedSourceKeys.size > 0 ? nestedSourceKeys : undefined,
		});
	}

	resolving.delete(value);
	resolved.add(value);
}

function flattenSources(
	parameterValues?: ParameterValueDefinition[],
): Map<string, SourceEntry> {
	const map: Map<string, SourceEntry> = new Map();
	const resolving = new WeakSet<IAppBuilderParameterValueSourceDefinition>();
	const resolved = new WeakSet<IAppBuilderParameterValueSourceDefinition>();

	if (parameterValues) {
		for (const param of parameterValues) {
			addSourceToFlatMap(param, map, resolving, resolved);
		}
	}

	return map;
}

function findSessionParameter(
	namespace: string,
	id: string,
): IParameterApi<unknown> | undefined {
	const session = useShapeDiverStoreSession.getState().sessions[namespace];
	if (!session) return undefined;
	return Object.values(session.parameters).find(
		(parameter) =>
			parameter.id === id ||
			parameter.name === id ||
			parameter.displayname === id,
	);
}

function getOutput(
	namespace: string,
	outputId: string,
): OutputSnapshot | undefined {
	const store = useShapeDiverStoreParameters
		.getState()
		.getOutput(namespace, outputId);
	if (store) return store.getState() as OutputSnapshot;

	const session = useShapeDiverStoreSession.getState().sessions[namespace];
	if (!session) return undefined;
	const output = Object.values(session.outputs).find(
		(candidate) =>
			candidate.id === outputId ||
			candidate.name === outputId ||
			candidate.displayname === outputId,
	);
	if (!output) return undefined;
	return {
		definition: {
			id: output.id,
			version: output.version,
		},
		content: output.content,
	};
}

async function resolveDataOutput(
	source: IAppBuilderParameterValueSourcePropsDataOutput,
	namespace: string,
	upload?: (file: File) => Promise<string>,
): Promise<string | undefined> {
	const output = getOutput(source.sessionId || namespace, source.name);
	if (!output) return undefined;
	if (output.content === undefined) {
		Logger.warn(`Output with id ${output.definition.id} has no content`);
		return undefined;
	}
	if (upload) {
		const blob = new Blob([JSON.stringify({content: output.content})], {
			type: "application/json",
		});
		const file = new File(
			[blob],
			`${output.definition.id}_${output.definition.version}.json`,
			{type: blob.type},
		);
		try {
			return await upload(file);
		} catch (error) {
			Logger.warn(
				"Could not upload output data parameter value source.",
				error,
			);
			return undefined;
		}
	}
	return JSON.stringify({content: output.content});
}

async function resolveScreenshot(
	source: IAppBuilderParameterValueSourcePropsScreenshot,
	upload: (file: File) => Promise<string>,
	viewportId?: string,
): Promise<string | undefined> {
	const accessFunctions =
		useShapeDiverStoreViewportAccessFunctions.getState()
			.viewportAccessFunctions;
	const getScreenshot = viewportId
		? accessFunctions[viewportId]?.getScreenshot
		: Object.values(accessFunctions)[0]?.getScreenshot;
	if (!getScreenshot) {
		Logger.warn(
			"Screenshot parameter value source skipped: viewport screenshot is not available.",
		);
		return undefined;
	}
	try {
		const data = await getScreenshot(source);
		if (!data) return undefined;
		const {blob} = Converter.instance.dataURLtoBlob(data);
		const file = new File([blob], "screenshot.png", {type: blob.type});
		return await upload(guessMissingMimeType(file) as File);
	} catch (error) {
		Logger.warn(
			"Could not resolve screenshot parameter value source.",
			error,
		);
		return undefined;
	}
}

async function resolveModelState(
	source: IAppBuilderParameterValueSourcePropsModelState,
	namespace: string,
	viewportId?: string,
): Promise<string | undefined> {
	const sessions = useShapeDiverStoreSession.getState().sessions;
	const accessFunctions =
		useShapeDiverStoreViewportAccessFunctions.getState()
			.viewportAccessFunctions;
	const viewportAccessFunctions = viewportId
		? accessFunctions[viewportId]
		: Object.values(accessFunctions)[0];
	try {
		const {modelStateId} = await createModelStateCore({
			sessionApi: sessions[namespace],
			sessions,
			sessionId: namespace,
			viewportAccessFunctions: {
				getScreenshot: viewportAccessFunctions?.getScreenshot,
				convertToGlTF: viewportAccessFunctions?.convertToGlTF,
			},
			clearUnsavedChanges:
				useShapeDiverStoreParameters.getState().clearUnsavedChanges,
			parameterNamesToAlwaysExclude:
				getCreateModelStateThemeDefaults()
					.parameterNamesToAlwaysExclude ?? [],
			props: {
				parameterNamesToInclude: source.parameterNamesToInclude,
				parameterNamesToExclude: source.parameterNamesToExclude,
				includeImage: source.includeImage,
				image: source.image,
				screenshotProps: source.screenshotProps,
				data: undefined,
				includeGltf: source.includeGltf,
			},
			markSaved: false,
		});
		if (!modelStateId) return undefined;
		const api = await ECommerceApiSingleton;
		const {href} = await api.updateSharingLink({
			modelStateId,
			updateUrl: source.updateUrl ?? false,
		});
		return href.toString();
	} catch (error) {
		Logger.warn(
			"Could not resolve model state parameter value source.",
			error,
		);
		return undefined;
	}
}

async function resolveSdtf(
	source: IAppBuilderParameterValueSourcePropsSdtf,
	namespace: string,
	index: number,
): Promise<string | undefined> {
	const output = getOutput(source.sessionId || namespace, source.name);
	if (!output) {
		Logger.warn(`sdTF output with name ${source.name} not found. `);
		return undefined;
	}
	if (output.content === undefined) {
		Logger.warn(`sdTF output with name ${source.name} has no content.`);
		return undefined;
	}
	if (!output.content[0]?.href) return undefined;

	const session = useShapeDiverStoreSession.getState().sessions[namespace];
	if (!session) return undefined;

	const assetDefinition = fetch(output.content[0].href)
		.then((response) => response.arrayBuffer())
		.then(async (arrayBuffer) => {
			const uploaded: ResAssetDefinition[] = await session.uploadSDTF([
				arrayBuffer,
			]);
			const sdtfResponse: ResStypeParameter = {
				asset: {id: uploaded[0].id},
			};
			if (source.chunk !== undefined) {
				sdtfResponse.asset!.chunk = source.chunk;
			}
			return JSON.stringify(sdtfResponse, null, 2);
		})
		.catch((error) => {
			Logger.warn(
				"Could not resolve sdTF parameter value source.",
				error,
			);
			return undefined;
		});

	const {createProcessManager, addProcess} =
		useShapeDiverStoreProcessManager.getState();
	const processManagerId = createProcessManager(namespace);
	addProcess(processManagerId, {
		id: `sdtf-${source.name}-${index}`,
		name: `sdTF: ${source.name}`,
		promise: assetDefinition,
	});

	return assetDefinition;
}

async function resolveExport(
	source: IAppBuilderParameterValueSourcePropsExport,
	namespace: string,
	upload: (file: File) => Promise<string>,
): Promise<string | undefined> {
	const exportNamespace = source.sessionId || namespace;
	const session =
		useShapeDiverStoreSession.getState().sessions[exportNamespace];
	if (!session) {
		Logger.warn("Export for parameter value source not found.");
		return undefined;
	}
	const exportApi = Object.values(session.exports).find(
		(candidate) =>
			candidate.id === source.name ||
			candidate.name === source.name ||
			candidate.displayname === source.name,
	);
	if (!exportApi) {
		Logger.warn("Export for parameter value source not found.");
		return undefined;
	}
	if (exportApi.type !== EXPORT_TYPE.DOWNLOAD) {
		Logger.warn(
			`Export with name ${exportApi.name} is not a download export and cannot be used as a parameter value source.`,
		);
		return undefined;
	}

	try {
		const response: ResExport = await exportApi.request(
			source.parameterValues,
		);
		if (response.content?.[0]?.href) {
			const authHeaders = session.jwtToken
				? {Authorization: session.jwtToken}
				: undefined;
			const fetched = await fetch(response.content[0].href, {
				headers: authHeaders,
			});
			const blob = await fetched.blob();
			const file = new File(
				[blob],
				response.filename || `${exportApi.id}_${exportApi.version}`,
				{type: blob.type},
			);
			return await upload(file);
		}
		if (response.content && response.content.length === 0 && response.msg) {
			return response.msg;
		}
		return undefined;
	} catch {
		return undefined;
	}
}

async function resolveOne(
	source: IAppBuilderParameterValueSourceDefinition,
	id: string,
	namespace: string,
	context: ResolveParameterValueSourcesContext,
	index: number,
): Promise<unknown> {
	const parameter = findSessionParameter(namespace, id);
	if (!parameter) {
		Logger.warn(
			`Parameter not found for parameter value source '${id}' in session '${namespace}'.`,
		);
		return undefined;
	}
	const type = parameter.type;

	if (isDataOutputSource(source)) {
		if (type !== PARAMETER_TYPE.STRING && type !== PARAMETER_TYPE.FILE) {
			Logger.warn(
				`Data output source parameter has invalid type ${type}. Only STRING and FILE are supported.`,
			);
			return undefined;
		}
		const upload =
			type === PARAMETER_TYPE.FILE
				? (parameter as IFileParameterApi).upload.bind(parameter)
				: undefined;
		return resolveDataOutput(source.props, namespace, upload);
	}
	if (isScreenshotSource(source)) {
		if (type !== PARAMETER_TYPE.FILE) {
			Logger.warn(
				`Screenshot source parameter has invalid type ${type}. Only FILE is supported.`,
			);
			return undefined;
		}
		return resolveScreenshot(
			source.props,
			(parameter as IFileParameterApi).upload.bind(parameter),
			context.viewportId,
		);
	}
	if (isModelStateSource(source)) {
		if (type !== PARAMETER_TYPE.STRING) {
			Logger.warn(
				`Model state source parameter has invalid type ${type}. Only STRING is supported.`,
			);
			return undefined;
		}
		return resolveModelState(
			source.props,
			context.namespace,
			context.viewportId,
		);
	}
	if (isSdtfSource(source)) {
		if (!type.startsWith("s")) {
			Logger.warn(
				`sdTF source parameter has invalid type ${type}. Only s-type parameters are supported.`,
			);
			return undefined;
		}
		return resolveSdtf(source.props, context.namespace, index);
	}
	if (isExportSource(source)) {
		if (type !== PARAMETER_TYPE.FILE) {
			Logger.warn(
				`Export source parameter has invalid type ${type}. Only FILE is supported.`,
			);
			return undefined;
		}
		return resolveExport(
			source.props,
			namespace,
			(parameter as IFileParameterApi).upload.bind(parameter),
		);
	}

	Logger.warn(
		`executeActions skipped unsupported parameter value source type "${source.type}".`,
	);
	return undefined;
}

function sourceWithResolvedNestedValues(
	entry: SourceEntry,
	resolvedMap: Map<string, unknown>,
): IAppBuilderParameterValueSourceDefinition {
	if (!entry.nestedSourceKeys || !isExportSource(entry.source)) {
		return entry.source;
	}

	const originalParams = entry.source.props.parameterValues || {};
	const resolvedParams: {
		[key: string]: IAppBuilderParameterValueDefinition;
	} = {};

	for (const [paramKey, paramValue] of Object.entries(originalParams)) {
		const nestedSourceKey = entry.nestedSourceKeys.get(paramKey);
		if (nestedSourceKey && resolvedMap.has(nestedSourceKey)) {
			resolvedParams[paramKey] = resolvedMap.get(
				nestedSourceKey,
			) as IAppBuilderParameterValueDefinition;
		} else {
			resolvedParams[paramKey] = paramValue;
		}
	}

	return {
		...entry.source,
		props: {
			...entry.source.props,
			parameterValues: resolvedParams,
		},
	};
}

/**
 * Resolve parameter values that may be defined via parameter value sources.
 * Same flattening / multi-pass order as {@link useResolveParameterValues},
 * without React hooks so executeActions can await the result.
 */
export async function resolveParameterValueSources(
	parameterValues: ParameterValueDefinition[] | undefined,
	context: ResolveParameterValueSourcesContext,
): Promise<string[] | undefined> {
	if (!parameterValues) return undefined;

	const flat = flattenSources(parameterValues);
	const resolvedMap = new Map<string, unknown>();
	let pending = Array.from(flat.values());

	while (pending.length > 0) {
		const ready: SourceEntry[] = [];
		for (const entry of pending) {
			if (entry.nestedSourceKeys && entry.nestedSourceKeys.size > 0) {
				let canResolve = true;
				for (const nestedSourceKey of entry.nestedSourceKeys.values()) {
					if (!resolvedMap.has(nestedSourceKey)) {
						canResolve = false;
						break;
					}
				}
				if (canResolve) ready.push(entry);
			} else {
				ready.push(entry);
			}
		}

		if (ready.length === 0) {
			Logger.warn(
				`Cannot resolve ${pending.length} sources. Possible circular dependency or missing nested sources.`,
			);
			for (const entry of pending) {
				resolvedMap.set(createSourceKey(entry.source), undefined);
			}
			break;
		}

		const values = await Promise.all(
			ready.map((entry, index) =>
				resolveOne(
					sourceWithResolvedNestedValues(entry, resolvedMap),
					entry.id,
					entry.namespace || context.namespace,
					context,
					index,
				),
			),
		);

		const readyIndexes = new Set(ready.map((entry) => entry.index));
		for (let i = 0; i < ready.length; i++) {
			resolvedMap.set(createSourceKey(ready[i].source), values[i]);
		}
		pending = pending.filter((entry) => !readyIndexes.has(entry.index));
	}

	const topLevelParameterToIndex: Record<string, number> = {};
	for (const param of parameterValues) {
		const {id, value} = param;
		if (
			typeof value === "object" &&
			value !== null &&
			isParameterSource(value)
		) {
			const entry = flat.get(createSourceKey(value));
			if (entry) topLevelParameterToIndex[id] = entry.index;
		}
	}

	const flatArray = Array.from(flat.values());
	return parameterValues.map((param) => {
		const {id, value} = param;
		if (
			typeof value === "object" &&
			value !== null &&
			isParameterSource(value)
		) {
			const index = topLevelParameterToIndex[id];
			const resolvedValue =
				index !== undefined
					? resolvedMap.get(createSourceKey(flatArray[index].source))
					: undefined;
			return resolvedValue !== undefined ? resolvedValue + "" : "";
		}
		return value + "";
	});
}
