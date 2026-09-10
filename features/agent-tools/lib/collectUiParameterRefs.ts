import type {IAppBuilder} from "@AppBuilderLib/features/appbuilder/config/appbuilder";
import {collectParameterRefs} from "@AppBuilderLib/features/appbuilder/lib/collectParameterRefs";

export type UiParameterRef = {name: string; sessionId?: string};

/**
 * Collect the parameter references of the App Builder data (name and session
 * id only), see collectParameterRefs for the traversal.
 */
export function collectUiParameterRefs(
	appBuilder: IAppBuilder,
): UiParameterRef[] {
	return collectParameterRefs(appBuilder).map(({name, sessionId}) =>
		sessionId === undefined ? {name} : {name, sessionId},
	);
}
