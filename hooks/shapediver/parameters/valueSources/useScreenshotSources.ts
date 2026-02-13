import {useShapeDiverStoreViewportAccessFunctions} from "@AppBuilderShared/store/useShapeDiverStoreViewportAccessFunctions";
import {IAppBuilderParameterValueSourcePropsScreenshot} from "@AppBuilderShared/types/shapediver/appbuilder";
import {Converter} from "@shapediver/viewer.session";
import {guessMissingMimeType} from "@shapediver/viewer.utils.mime-type";
import {useEffect, useState} from "react";
import {useShallow} from "zustand/react/shallow";
import {useViewportId} from "../../viewer/useViewportId";

export function useScreenshotSources(props: {
	namespace: string;
	sources?: {
		source: IAppBuilderParameterValueSourcePropsScreenshot;
		upload: (file: File) => Promise<string>;
	}[];
}): {
	screenshotValues: (string | undefined)[] | undefined;
	resetScreenshotValues: () => void;
} {
	const {sources, namespace} = props;

	const [screenshotValues, setScreenshotValues] = useState<
		(string | undefined)[] | undefined
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
				const {source, upload} = sources[i];
				const screenshotPromise = getScreenshot(source)
					.then((data) => {
						// If screenshot returns undefined or empty, return undefined
						if (!data) {
							return undefined;
						}

						// Convert to file and upload
						const {blob} = Converter.instance.dataURLtoBlob(data);
						const file = new File([blob], "screenshot.png", {
							type: blob.type,
						});
						return upload(guessMissingMimeType(file) as File);
					})
					.catch((error) => {
						console.error(`Screenshot ${i} error:`, error);
						return undefined;
					});

				promises.push(screenshotPromise);
			}

			Promise.all(promises).then((results) => {
				setScreenshotValues(results);
			});
		}
	}, [sources, getScreenshot, namespace]);

	return {
		screenshotValues,
		resetScreenshotValues: () => setScreenshotValues(undefined),
	};
}
