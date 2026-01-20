import {useShapeDiverStoreSession} from "@AppBuilderShared/store/useShapeDiverStoreSession";
import {PropsExport} from "@AppBuilderShared/types/components/shapediver/propsExport";
import {
	IAppBuilderParameterValueDefinition,
	IAppBuilderParameterValueSourcePropsExport,
} from "@AppBuilderShared/types/shapediver/appbuilder";
import {Logger} from "@AppBuilderShared/utils/logger";
import {ResExport} from "@shapediver/sdk.geometry-api-sdk-v2";
import {EXPORT_TYPE, IExportApi} from "@shapediver/viewer.session";
import {useEffect, useMemo, useState} from "react";
import {useShallow} from "zustand/react/shallow";

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
	const exportApis: (IExportApi | undefined)[] = useShapeDiverStoreSession(
		useShallow((state) => {
			return exportMap.map(({namespace, exportId}) => {
				if (!state) return;
				const session = state.sessions[namespace];
				if (!session) return;

				const exportApi = Object.values(session.exports).find(
					(e) =>
						e.id === exportId ||
						e.name === exportId ||
						e.displayname === exportId,
				);
				return exportApi;
			});
		}),
	);

	// create a combined array of exports and the parameter upload functions
	const exportResults:
		| {
				export: IExportApi | undefined;
				parameterValues?: {
					[key: string]: IAppBuilderParameterValueDefinition;
				};
				upload: (file: File) => Promise<string>;
		  }[]
		| undefined = useMemo(() => {
		if (!exportApis || !sources) return undefined;
		return exportApis.map((exportItem, index) => ({
			export: exportItem,
			parameterValues: sources[index].source.parameterValues,
			upload: sources[index].upload,
		}));
	}, [exportApis, sources]);

	// load all exports
	// and only set the return values once all are loaded
	// Note: parameterValues at this point should only contain primitives (string | number | boolean)
	// as nested sources have already been resolved by useResolveParameterValues
	useEffect(() => {
		if (!exportResults) return;

		const promises = [];

		for (let i = 0; i < exportResults.length; i++) {
			const {export: e, upload, parameterValues} = exportResults[i];

			if (!e) {
				Logger.warn(`Export for parameter value source not found.`);
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

			const file = e
				.request(parameterValues)
				.then(async (response: ResExport) => {
					if (
						response.content &&
						response.content[0] &&
						response.content[0].href
					) {
						const content = response.content[0];
						const url = content.href;
						const res = await fetch(url);
						const fetched = await (typeof res === "string"
							? fetch(res)
							: Promise.resolve(res));
						const blob = await fetched.blob();
						const file = new File(
							[blob],
							response.filename || `${e.id}_${e.version}`,
							{type: blob.type},
						);
						return upload(file);
					} else if (
						response.content &&
						response.content.length === 0 &&
						response.msg
					) {
						return response.msg;
					}
					return undefined;
				});

			promises.push(file);
		}

		Promise.all(promises).then((results) => {
			setExportValues(results);
		});
	}, [exportResults]);

	return {
		exportValues,
		resetExportValues: () => setExportValues(undefined),
	};
}
