import {IAppBuilderWidgetPropsAgent} from "@AppBuilderLib/features/appbuilder/config/appbuilder";
import {Loader, Paper} from "@mantine/core";
import {lazy, Suspense} from "react";
import type {AppBuilderAgentWidgetThemePropsType} from "../config/appBuilderAgentWidget";

type Props = IAppBuilderWidgetPropsAgent & {
	namespace: string;
};

const AppBuilderAgentWidgetView = lazy(
	() => import("./AppBuilderAgentWidgetView"),
);

/**
 * In-page OpenAI agent widget.
 */
export default function AppBuilderAgentWidgetComponent(
	props: Props & AppBuilderAgentWidgetThemePropsType,
) {
	return (
		<Suspense
			name="AppBuilderAgentWidgetComponent"
			fallback={
				<Paper>
					<Loader />
				</Paper>
			}
		>
			<AppBuilderAgentWidgetView {...props} />
		</Suspense>
	);
}
