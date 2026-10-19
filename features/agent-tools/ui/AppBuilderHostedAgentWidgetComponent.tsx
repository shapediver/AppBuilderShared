import type {IAppBuilderWidgetPropsHostedAgent} from "@AppBuilderLib/features/appbuilder/config/appbuilder";
import {Loader, Paper} from "@mantine/core";
import {lazy, Suspense} from "react";

const AppBuilderHostedAgentWidgetView = lazy(
	() => import("./AppBuilderHostedAgentWidgetView"),
);

/**
 * Hosted AppBuilderAgent iframe. Resolves its own URL; no `url` prop.
 */
export default function AppBuilderHostedAgentWidgetComponent(
	props: IAppBuilderWidgetPropsHostedAgent,
) {
	return (
		<Suspense
			name="AppBuilderHostedAgentWidgetComponent"
			fallback={
				<Paper>
					<Loader />
				</Paper>
			}
		>
			<AppBuilderHostedAgentWidgetView {...props} />
		</Suspense>
	);
}
