import type {
	RuntimeToolbarMenuDefinition,
	RuntimeToolbarMenuVisibility,
	ToolbarCommandItem,
	ToolbarMenuItem,
} from "@AppBuilderLib/features/appbuilder/config/toolbarRenderTypes";
import {
	runtimeToolbarContributionRegistry,
	type RuntimeToolbarContribution,
} from "@AppBuilderLib/features/appbuilder/model/runtimeToolbarContributionRegistry";
import {useEffect, useRef} from "react";

interface UseRuntimeToolbarContributionOptions {
	id: string;
	namespace: string;
	viewportId: string;
	menu: RuntimeToolbarMenuDefinition;
	enabled: boolean;
	items: ToolbarMenuItem[];
	commands?: ToolbarCommandItem[];
	sectionId: string;
	groupId?: string;
	order?: number;
	menuVisibility?: RuntimeToolbarMenuVisibility;
}

/** Registers feature-owned content and presentation with the runtime toolbar. */
export function useRuntimeToolbarContribution({
	id,
	namespace,
	viewportId,
	menu,
	enabled,
	items,
	commands,
	sectionId,
	groupId,
	order,
	menuVisibility,
}: UseRuntimeToolbarContributionOptions) {
	const registrationTokenRef = useRef<symbol>();
	useEffect(() => {
		if (!enabled) return;

		const contribution: RuntimeToolbarContribution = {
			id,
			namespace,
			viewportId,
			menu,
			items,
			commands,
			sectionId,
			groupId,
			order,
			menuVisibility,
		};
		const token = runtimeToolbarContributionRegistry.register(contribution);
		registrationTokenRef.current = token;
		return () => {
			runtimeToolbarContributionRegistry.unregister(id, token);
			if (registrationTokenRef.current === token)
				registrationTokenRef.current = undefined;
		};
	}, [enabled, id, namespace, viewportId]);

	useEffect(() => {
		if (enabled)
			runtimeToolbarContributionRegistry.update(
				id,
				{
					items,
					menu,
					commands,
					sectionId,
					groupId,
					order,
					menuVisibility,
				},
				registrationTokenRef.current,
			);
	}, [
		commands,
		enabled,
		groupId,
		id,
		items,
		menu,
		menuVisibility,
		order,
		sectionId,
	]);
}
