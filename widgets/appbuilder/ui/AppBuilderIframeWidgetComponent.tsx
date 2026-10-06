import type {IAppBuilderWidgetPropsIframe} from "@AppBuilderLib/features/appbuilder/config/appbuilder";
import {Center, Loader} from "@mantine/core";
import {useEffect, useState} from "react";
import classes from "./AppBuilderIframeWidgetComponent.module.css";
import {resolveIframeSrc} from "./resolveIframeSrc";

const DEFAULT_HEIGHT = "24rem";

function frameHeight(height: IAppBuilderWidgetPropsIframe["height"]): string {
	if (typeof height === "number" && Number.isFinite(height)) {
		return `${height}px`;
	}
	if (typeof height === "string" && height.trim()) {
		return height.trim();
	}
	return DEFAULT_HEIGHT;
}

export type AppBuilderIframeWidgetComponentProps =
	IAppBuilderWidgetPropsIframe & {
		/** Called with the iframe window after load, and with `null` on unmount. */
		onLoad?: (frame: Window | null) => void;
	};

/**
 * Iframe widget. `url` must be an absolute http(s) page.
 */
export default function AppBuilderIframeWidgetComponent({
	url,
	title,
	height,
	onLoad,
}: AppBuilderIframeWidgetComponentProps) {
	const src = resolveIframeSrc(url);
	const [loadedSrc, setLoadedSrc] = useState<string | null>(null);
	const loaded = loadedSrc === src;

	useEffect(() => {
		if (!onLoad) {
			return;
		}
		return () => onLoad(null);
	}, [onLoad]);

	if (!src) {
		return null;
	}

	return (
		<div className={classes.root} style={{height: frameHeight(height)}}>
			{loaded ? null : (
				<Center
					aria-label="Loading"
					className={classes.pending}
					role="status"
				>
					<Loader size="md" type="oval" />
				</Center>
			)}
			<iframe
				className={
					loaded
						? classes.frame
						: `${classes.frame} ${classes.framePending}`
				}
				src={src}
				title={title?.trim() || "Embedded content"}
				onLoad={(event) => {
					setLoadedSrc(src);
					onLoad?.(event.currentTarget.contentWindow);
				}}
			/>
		</div>
	);
}
