import {useShapeDiverStoreParameters} from "@AppBuilderShared/store/useShapeDiverStoreParameters";
import {IAppBuilderParameterValueSourcePropsExport} from "@AppBuilderShared/types/shapediver/appbuilder";
import {ResExport} from "@shapediver/sdk.geometry-api-sdk-v2";
import {EXPORT_TYPE, PARAMETER_TYPE} from "@shapediver/viewer.session";
import {useEffect, useState} from "react";

export function useExportSources(props?: {
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
	// default to empty values if no props are given
	const {namespace, sources} = props ?? {
		namespace: "",
		sources: [],
	};

	const exportStores = useShapeDiverStoreParameters((state) => {
		return state.exportStores;
	});

	const [exportValues, setExportValues] = useState<
		(string | File | undefined)[] | undefined
	>(undefined);

	// load all exports
	// and only set the return values once all are loaded
	useEffect(() => {
		if (!exportStores || !sources) return;

		const promises = [];

		for (let i = 0; i < sources.length; i++) {
			const {source} = sources[i];
			const {sessionId, name} = source;

			const exportStore = exportStores[sessionId || namespace];
			if (!exportStore) {
				console.warn(
					`Session with id ${sessionId || namespace} not found`,
				);
				promises.push(Promise.resolve(undefined));
				continue;
			}

			const exportValue = Object.values(exportStore).find(
				(e) =>
					e.getState().definition.displayname === name ||
					e.getState().definition.name === name ||
					e.getState().definition.id === name,
			);
			if (!exportValue) {
				console.warn(
					`Export with name ${name} not found in session ${sessionId || namespace}`,
				);
				promises.push(Promise.resolve(undefined));
				continue;
			}

			// check if the export is a download export
			if (
				exportValue.getState().definition.type !== EXPORT_TYPE.DOWNLOAD
			) {
				console.warn(
					`Export with name ${name} in session ${sessionId || namespace} is not a download export`,
				);
				promises.push(Promise.resolve(undefined));
				continue;
			}

			const exportValueState = exportValue.getState();

			const file = exportValueState.actions
				.request()
				.then(async (response: ResExport) => {
					if (
						response.content &&
						response.content[0] &&
						response.content[0].href
					) {
						const content = response.content[0];
						const url = content.href;
						const res = await exportValueState.actions.fetch(url);
						const fetched = await (typeof res === "string"
							? fetch(res)
							: Promise.resolve(res));
						const blob = await fetched.blob();
						const file = new File(
							[blob],
							response.filename ||
								`${exportValueState.definition.id}_${exportValueState.definition.version}`,
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
	}, [sources, exportStores]);

	return {
		exportValues,
		setExportValues,
	};
}
