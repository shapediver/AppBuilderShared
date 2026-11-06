import {Loader, Paper} from "@mantine/core";
import {lazy, Suspense} from "react";
import type {AppBuilderIframeWidgetComponentProps} from "./AppBuilderIframeWidgetView";

export {
	AppBuilderIframeWidgetThemeProps,
	frameHeight,
} from "./AppBuilderIframeWidgetView";
export type {
	AppBuilderIframeWidgetComponentProps,
	AppBuilderIframeWidgetComponentStyleProps,
} from "./AppBuilderIframeWidgetView";

const AppBuilderIframeWidgetView = lazy(
	() => import("./AppBuilderIframeWidgetView"),
);

/**
 * Iframe widget. `url` must be an absolute http(s) page.
 */
export default function AppBuilderIframeWidgetComponent(
	props: AppBuilderIframeWidgetComponentProps,
) {
	return (
		<Suspense
			name="AppBuilderIframeWidgetComponent"
			fallback={
				<Paper
					px={0}
					py={0}
					shadow="md"
					aria-label="Loading"
					role="status"
				>
					<Loader size="md" type="oval" />
				</Paper>
			}
		>
			<AppBuilderIframeWidgetView {...props} />
		</Suspense>
	);
}
