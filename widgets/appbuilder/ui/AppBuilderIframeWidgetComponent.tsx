import {Center, Loader} from "@mantine/core";
import {lazy, Suspense} from "react";
import type {AppBuilderIframeWidgetComponentProps} from "./AppBuilderIframeWidgetView";

export type {AppBuilderIframeWidgetComponentProps};
export {frameHeight} from "./AppBuilderIframeWidgetView";

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
				<Center aria-label="Loading" role="status">
					<Loader size="md" type="oval" />
				</Center>
			}
		>
			<AppBuilderIframeWidgetView {...props} />
		</Suspense>
	);
}
