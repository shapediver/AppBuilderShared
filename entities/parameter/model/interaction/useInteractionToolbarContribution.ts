import type {
	RuntimeToolbarMenuDefinition,
	RuntimeToolbarMenuVisibility,
	ToolbarCommandItem,
	ToolbarMenuItem,
} from "@AppBuilderLib/features/appbuilder/config/toolbarRenderTypes";
import {useRuntimeToolbarContribution} from "@AppBuilderLib/features/appbuilder/model/useRuntimeToolbarContribution";

interface UseInteractionToolbarContributionOptions {
	id: string;
	namespace: string;
	viewportId: string;
	presentation: "widget" | "toolbar";
	menu: RuntimeToolbarMenuDefinition;
	items: ToolbarMenuItem[];
	commands?: ToolbarCommandItem[];
	sectionId: string;
	order?: number;
	menuVisibility?: RuntimeToolbarMenuVisibility;
}

/**
 * Interaction-domain adapter for the generic runtime-toolbar contribution API.
 * Parameter UI supplies its own menu presentation and interaction behavior.
 */
export const useInteractionToolbarContribution = ({
	presentation,
	...contribution
}: UseInteractionToolbarContributionOptions) =>
	useRuntimeToolbarContribution({
		...contribution,
		enabled: presentation === "toolbar",
	});
