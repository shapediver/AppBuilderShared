import {PropsExport} from "@AppBuilderLib/entities/export/config/propsExport";
import {useShapeDiverStoreSession} from "@AppBuilderLib/entities/session/model/useShapeDiverStoreSession";
import {
	IAppBuilderParameterValueDefinition,
	IAppBuilderParameterValueSourcePropsExport,
} from "@AppBuilderLib/features/appbuilder/config/appbuilder";
import {Logger} from "@AppBuilderLib/shared/lib/logger";
import {ResExport} from "@shapediver/sdk.geometry-api-sdk-v2";
import {EXPORT_TYPE, IExportApi} from "@shapediver/viewer.session";
import {useCallback, useEffect, useMemo, useRef, useState} from "react";
import {useShallow} from "zustand/react/shallow";

type ExportApiSelection = Record<string, IExportApi | string | undefined>;

type ExportResult = {
	export: IExportApi | undefined;
	jwtToken: string | undefined;
	parameterValues?: {
		[key: string]: IAppBuilderParameterValueDefinition;
	};
	upload: (file: File) => Promise<string>;
};

const createExportRequestKey = (exportResults: ExportResult[]) =>
	JSON.stringify(
		exportResults.map(({export: e, jwtToken, parameterValues}) => ({
			exportId: e?.id,
			exportName: e?.name,
			jwtToken,
			parameterValues,
		})),
	);

export function useExportSources(props: {
	namespace: string;
	sources?: {
		source: IAppBuilderParameterValueSourcePropsExport;
		upload: (file: File) => Promise<string>;
	}[];
}): {
	exportValues: (string | undefined)[] | undefined;
	resetExportValues: () => void;
} {
	const {namespace, sources} = props;

	const [exportValues, setExportValues] = useState<
		(string | undefined)[] | undefined
	>(undefined);
	const requestKeyRef = useRef<string | undefined>(undefined);

	// create export map from sources
	const exportMap: PropsExport[] = useMemo(() => {
		if (!sources) return [];
		return sources
			.map(({source}) => {
				const {sessionId, name} = source;
				if (!namespace && !sessionId) return;

				return {
					namespace: sessionId || namespace,
					exportId: name,
				};
			})
			.filter((e): e is PropsExport => !!e);
	}, [namespace, sources]);

	// get all export APIs from store
	// we don't use the useExports hook here because instances are not registered as exports in the store
	// The selector must return shallow-comparable values. Returning freshly-created
	// wrapper objects here causes the effect below to re-run on unrelated session
	// store updates, which can recursively trigger export requests.
	const exportApiSelection = useShapeDiverStoreSession(
		useShallow((state) => {
			const selection: ExportApiSelection = {};

			exportMap.forEach(({namespace, exportId}, index) => {
				const exportKey = `export-${index}`;
				const jwtTokenKey = `jwtToken-${index}`;

				if (!state) {
					selection[exportKey] = undefined;
					selection[jwtTokenKey] = undefined;
					return;
				}

				const session = state.sessions[namespace];
				if (!session) {
					selection[exportKey] = undefined;
					selection[jwtTokenKey] = undefined;
					return;
				}

				const exportApi = Object.values(session.exports).find(
					(e) =>
						e.id === exportId ||
						e.name === exportId ||
						e.displayname === exportId,
				);
				selection[exportKey] = exportApi;
				selection[jwtTokenKey] = session.jwtToken;
			});

			return selection;
		}),
	);

	const exportApis: {
		export: IExportApi | undefined;
		jwtToken: string | undefined;
	}[] = useMemo(
		() =>
			exportMap.map((_, index) => ({
				export: exportApiSelection[`export-${index}`] as
					| IExportApi
					| undefined,
				jwtToken: exportApiSelection[`jwtToken-${index}`] as
					| string
					| undefined,
			})),
		[exportApiSelection, exportMap],
	);

	// create a combined array of exports and the parameter upload functions
	const exportResults: ExportResult[] | undefined = useMemo(() => {
		if (!exportApis || !sources) return undefined;
		return exportApis.map((exportItem, index) => ({
			export: exportItem.export,
			jwtToken: exportItem.jwtToken,
			parameterValues: sources[index].source.parameterValues,
			upload: sources[index].upload,
		}));
	}, [exportApis, sources]);

	// load all exports
	// and only set the return values once all are loaded
	// Note: parameterValues at this point should only contain primitives (string | number | boolean)
	// as nested sources have already been resolved by useResolveParameterValues
	useEffect(() => {
		if (!exportResults) {
			return;
		}

		// If there are no exports to process, don't set exportValues yet
		// This prevents the parent hook from thinking we're ready when we're actually
		// waiting for nested sources to resolve
		if (exportResults.length === 0) {
			return;
		}

		const requestKey = createExportRequestKey(exportResults);
		if (requestKeyRef.current === requestKey) return;
		requestKeyRef.current = requestKey;

		const promises = [];

		for (let i = 0; i < exportResults.length; i++) {
			const {
				export: e,
				jwtToken,
				upload,
				parameterValues,
			} = exportResults[i];

			if (!e) {
				Logger.warn("Export for parameter value source not found.");
				promises.push(Promise.resolve(undefined));
				continue;
			}

			// check if the export is a download export
			if (e.type !== EXPORT_TYPE.DOWNLOAD) {
				Logger.warn(
					`Export with name ${e.name} is not a download export and cannot be used as a parameter value source.`,
				);
				promises.push(Promise.resolve(undefined));
				continue;
			}

			const filePromise = e
				.request(parameterValues)
				.then(async (response: ResExport) => {
					if (
						response.content &&
						response.content[0] &&
						response.content[0].href
					) {
						const content = response.content[0];
						const url = content.href;
						const authHeaders = jwtToken
							? {Authorization: jwtToken}
							: undefined;
						const res = await fetch(url, {headers: authHeaders});
						const fetched = await (typeof res === "string"
							? fetch(res, {headers: authHeaders})
							: Promise.resolve(res));
						const blob = await fetched.blob();
						const file = new File(
							[blob],
							response.filename || `${e.id}_${e.version}`,
							{type: blob.type},
						);
						const uploadResult = await upload(file);
						return uploadResult;
					} else if (
						response.content &&
						response.content.length === 0 &&
						response.msg
					) {
						return response.msg;
					}
					return undefined;
				})
				.catch(() => {
					return undefined;
				});

			promises.push(filePromise);
		}

		Promise.all(promises).then((results) => {
			if (requestKeyRef.current === requestKey) {
				setExportValues(results);
			}
		});
	}, [exportResults]);

	const resetExportValues = useCallback(() => {
		requestKeyRef.current = undefined;
		setExportValues(undefined);
	}, []);

	return {
		exportValues,
		resetExportValues,
	};
}
