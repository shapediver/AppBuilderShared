import {useShapeDiverStoreViewportAccessFunctions} from "@AppBuilderShared/store/useShapeDiverStoreViewportAccessFunctions";
import {IAppBuilderParameterValueSourcePropsScreenshot} from "@AppBuilderShared/types/shapediver/appbuilder";
import {Converter} from "@shapediver/viewer.session";
import {guessMissingMimeType} from "@shapediver/viewer.utils.mime-type";
import {useEffect, useState} from "react";
import {useShallow} from "zustand/react/shallow";
import {useViewportId} from "../../viewer/useViewportId";

export function useScreenshotSource(props?: {
	namespace: string;
	sources?: IAppBuilderParameterValueSourcePropsScreenshot[];
}): {
	screenshotValues: unknown[] | undefined;
	setScreenshotValues: React.Dispatch<
		React.SetStateAction<unknown[] | undefined>
	>;
} {
	// default to empty values if no props are given
	const {namespace, sources} = props ?? {
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
				const source = sources[i];
				const screenshot = getScreenshot().then((data) => {
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
	}, [getScreenshot, namespace, sources]);

	return {
		screenshotValues,
		setScreenshotValues,
	};
}
