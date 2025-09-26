import {IAppBuilderParameterValueSourcePropsExport} from "@AppBuilderShared/types/shapediver/appbuilder";
import {PARAMETER_TYPE} from "@shapediver/viewer.session";
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

	const [exportValues, setExportValues] = useState<
		(string | File | undefined)[] | undefined
	>(undefined);

	// load all exports
	// and only set the return values once all are loaded
	useEffect(() => {
		if (sources && sources.length > 0) {
			const exportsArray: (string | File | undefined)[] = [];
		}
	}, [sources]);

	return {
		exportValues,
		setExportValues,
	};
}
