import {PropsExport} from "@AppBuilderShared/types/components/shapediver/propsExport";
import {IAppBuilderParameterValueSourcePropsExport} from "@AppBuilderShared/types/shapediver/appbuilder";
import {IShapeDiverExport} from "@AppBuilderShared/types/shapediver/export";
import {ResExport} from "@shapediver/sdk.geometry-api-sdk-v2";
import {EXPORT_TYPE, PARAMETER_TYPE} from "@shapediver/viewer.session";
import {useEffect, useMemo, useState} from "react";
import {useExports} from "../useExports";

export function useExportSources(props: {
	namespace: string;
	sources?: {
		source: IAppBuilderParameterValueSourcePropsExport;
		type: PARAMETER_TYPE;
	}[];
}): {
	exportValues: (string | File | undefined)[] | undefined;
	setExportValues: React.Dispatch<
		React.SetStateAction<(string | File | undefined)[] | undefined>
	>;
} {
	const {namespace, sources} = props;

	const [exportValues, setExportValues] = useState<
		(string | File | undefined)[] | undefined
	>(undefined);

	// create export map from sources
	const exportMap: PropsExport[] = useMemo(() => {
		if (!sources) return [];
		return sources
			.map(({source}) => {
				const {sessionId, name} = source;
				return {
					namespace: sessionId || namespace,
					exportId: name,
				};
			})
			.filter((o) => o.exportId);
	}, [namespace, sources]);

	// get all exports
	const exports: (IShapeDiverExport | undefined)[] = useExports(exportMap);

	// load all exports
	// and only set the return values once all are loaded
	useEffect(() => {
		if (!exports) return;

		const promises = [];

		for (let i = 0; i < exports.length; i++) {
			const e = exports[i];

			if (!e) {
				console.warn(`Export for parameter value source not found.`);
				promises.push(Promise.resolve(undefined));
				continue;
			}

			const {definition, actions} = e;

			// check if the export is a download export
			if (definition.type !== EXPORT_TYPE.DOWNLOAD) {
				console.warn(
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
					return file;
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
	}, [exports]);

	return {
		exportValues,
		setExportValues,
	};
}
