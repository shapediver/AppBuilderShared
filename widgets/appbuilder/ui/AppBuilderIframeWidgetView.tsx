import type {IAppBuilderWidgetPropsIframe} from "@AppBuilderLib/features/appbuilder/config/appbuilder";
import type {MantinePaperProps} from "@AppBuilderLib/shared/mantine-props/paper";
import {
	Center,
	Loader,
	MantineThemeComponent,
	Paper,
	useProps,
} from "@mantine/core";
import {useEffect, useState} from "react";
import classes from "./AppBuilderIframeWidgetComponent.module.css";
import {resolveIframeSrc} from "./resolveIframeSrc";

const DEFAULT_HEIGHT = "24rem";

export function frameHeight(
	height: IAppBuilderWidgetPropsIframe["height"],
): string {
	if (typeof height === "number" && Number.isFinite(height)) {
		return `${height}px`;
	}
	if (typeof height === "string" && height.trim()) {
		return height.trim();
	}
	return DEFAULT_HEIGHT;
}

/**
 * Theme defaults for the iframe / hosted-agent frame chrome.
 *
 * Matches other widgets: rounded `Paper` with the standard shadow.
 *
 * @docAttached
 * @category widget
 * @configPath themeOverrides.components.AppBuilderIframeWidgetComponent.defaultProps
 * @displayName AppBuilderIframeWidgetComponent
 */
export type AppBuilderIframeWidgetComponentStyleProps = MantinePaperProps;

const defaultStyleProps: Partial<AppBuilderIframeWidgetComponentStyleProps> = {
	// Prefer px/py over `p`: Paper's theme defaults set px/py, which win over `p`.
	px: 0,
	py: 0,
	shadow: "md",
};

type AppBuilderIframeWidgetThemePropsType =
	Partial<AppBuilderIframeWidgetComponentStyleProps>;

export function AppBuilderIframeWidgetThemeProps(
	props: AppBuilderIframeWidgetThemePropsType,
): MantineThemeComponent {
	return {
		defaultProps: props,
	};
}

export type AppBuilderIframeWidgetComponentProps =
	IAppBuilderWidgetPropsIframe &
		AppBuilderIframeWidgetThemePropsType & {
			/** Called with the iframe window after load, and with `null` on unmount. */
			onLoad?: (frame: Window | null) => void;
		};

/**
 * Iframe widget view. `url` must be an absolute http(s) page.
 */
export default function AppBuilderIframeWidgetView(
	props: AppBuilderIframeWidgetComponentProps,
) {
	const {url, title, height, onLoad, ...rest} = props;
	const paperProps = useProps(
		"AppBuilderIframeWidgetComponent",
		defaultStyleProps,
		rest,
	);
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
		<Paper
			{...paperProps}
			className={classes.root}
			style={{height: frameHeight(height), overflow: "hidden"}}
		>
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
		</Paper>
	);
}
