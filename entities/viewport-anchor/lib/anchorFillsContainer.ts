import {AppBuilderContainerOrientation} from "@AppBuilderLib/features/appbuilder/lib/AppBuilderContainerOrientation";

/**
 * Below the mobile breakpoint, anchor content renders inside a standard
 * container. In a horizontal one (e.g. `top`) it fills the container height
 * like native content and skips the anchor's scroll area, so percentage
 * sizes (e.g. image widgets) resolve against the container.
 */
export function anchorFillsContainer(options: {
	aboveMobileBreakpoint: boolean;
	orientation: AppBuilderContainerOrientation | undefined;
}): boolean {
	return (
		!options.aboveMobileBreakpoint &&
		options.orientation === AppBuilderContainerOrientation.Horizontal
	);
}
