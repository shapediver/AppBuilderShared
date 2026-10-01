import {createContext} from "react";

export interface ToolbarContainerExclusivity {
	exclusiveContainers: boolean;
	siblingAnchorIds: string[];
}

/** Toolbar-scoped exclusivity for setContainerVisibility actions. */
export const ToolbarContainerExclusivityContext =
	createContext<ToolbarContainerExclusivity>({
		exclusiveContainers: true,
		siblingAnchorIds: [],
	});
