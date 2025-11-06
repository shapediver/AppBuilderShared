import {PropsExport} from "@AppBuilderShared/types/components/shapediver/propsExport";
import {IAppBuilderParameterValueSourcePropsExport} from "@AppBuilderShared/types/shapediver/appbuilder";
import {IShapeDiverExport} from "@AppBuilderShared/types/shapediver/export";
import {Logger} from "@AppBuilderShared/utils/logger";
import {ResExport} from "@shapediver/sdk.geometry-api-sdk-v2";
import {EXPORT_TYPE} from "@shapediver/viewer.session";
import {useEffect, useMemo, useState} from "react";
import {useExports} from "../useExports";

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

	// get all exports
	const exports: (IShapeDiverExport | undefined)[] = useExports(exportMap);

	// create a combined array of exports and the parameter upload functions
	const exportResults:
		| {
				export: IShapeDiverExport | undefined;
				upload: (file: File) => Promise<string>;
		  }[]
		| undefined = useMemo(() => {
		if (!exports || !sources) return undefined;
		return exports.map((exportItem, index) => ({
			export: exportItem,
			upload: sources[index].upload,
		}));
	}, [exports, sources]);

	// load all exports
	// and only set the return values once all are loaded
	useEffect(() => {
		if (!exportResults) return;

		const promises = [];

		for (let i = 0; i < exportResults.length; i++) {
			const {export: e, upload} = exportResults[i];

			if (!e) {
				Logger.warn(`Export for parameter value source not found.`);
				promises.push(Promise.resolve(undefined));
				continue;
			}

			const {definition, actions} = e;

			// check if the export is a download export
			if (definition.type !== EXPORT_TYPE.DOWNLOAD) {
				Logger.warn(
					`Export with name ${definition.name} is not a download export and cannot be used as a parameter value source.`,
				);
				promises.push(Promise.resolve(undefined));
				continue;
			}

			const file = actions.request().then(async (response: ResExport) => {
				if (
					response.content &&
					response.content[0] &&
					response.content[0].href
				) {
					const content = response.content[0];
					const url = content.href;
					const res = await actions.fetch(url);
					const fetched = await (typeof res === "string"
						? fetch(res)
						: Promise.resolve(res));
					const blob = await fetched.blob();
					const file = new File(
						[blob],
						response.filename ||
							`${definition.id}_${definition.version}`,
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
