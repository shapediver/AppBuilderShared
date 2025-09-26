import {useShapeDiverStoreViewportAccessFunctions} from "@AppBuilderShared/store/useShapeDiverStoreViewportAccessFunctions";
import {IAppBuilderParameterValueSourcePropsScreenshot} from "@AppBuilderShared/types/shapediver/appbuilder";
import {Converter, PARAMETER_TYPE} from "@shapediver/viewer.session";
import {guessMissingMimeType} from "@shapediver/viewer.utils.mime-type";
import {useEffect, useState} from "react";
import {useShallow} from "zustand/react/shallow";
import {useViewportId} from "../../viewer/useViewportId";

export function useScreenshotSources(props?: {
	namespace: string;
	sources?: {
		source: IAppBuilderParameterValueSourcePropsScreenshot;
		type: PARAMETER_TYPE;
	}[];
}): {
	screenshotValues: unknown[] | undefined;
	setScreenshotValues: React.Dispatch<
		React.SetStateAction<unknown[] | undefined>
	>;
} {
	// default to empty values if no props are given
	const {sources} = props ?? {
		namespace: "",
		sources: [],
	};

	const [screenshotValues, setScreenshotValues] = useState<
		unknown[] | undefined
	>(undefined);

	const {viewportId} = useViewportId();
	const {getScreenshot} = useShapeDiverStoreViewportAccessFunctions(
		useShallow((state) => ({
			getScreenshot:
				state.viewportAccessFunctions[viewportId]?.getScreenshot,
		})),
	);

	// load all screenshots
	// and only set the return values once all are loaded
	// to avoid multiple re-renders
	useEffect(() => {
		if (getScreenshot && sources && sources.length > 0) {
			const promises = [];
			for (let i = 0; i < sources.length; i++) {
				const {source} = sources[i];
				const screenshot = getScreenshot(source).then((data) => {
					// create a file from the data string
					const {blob} = Converter.instance.dataURLtoBlob(data);
					const file = new File([blob], "screenshot.png", {
						type: blob.type,
					});
					return guessMissingMimeType(file);
				});

				promises.push(screenshot);
			}

			Promise.all(promises).then((results) => {
				setScreenshotValues(results);
			});
		}
	}, [sources]);

	return {
		screenshotValues,
		setScreenshotValues,
	};
}
