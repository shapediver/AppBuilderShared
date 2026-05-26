import "@shapediver/viewer.shared.types";

declare module "@shapediver/viewer.shared.types" {
	interface IInteractionParameterProps {
		/** When true, interaction effects respect scene geometry depth. */
		occludeBySceneGeometry?: boolean;
	}
}

/** Interaction managers that support {@link occludeBySceneGeometry} at runtime. */
export type OccludableInteractionManager = {
	occludeBySceneGeometry?: boolean;
};

export function setOccludeBySceneGeometry(
	manager: object,
	value?: boolean,
): void {
	(manager as OccludableInteractionManager).occludeBySceneGeometry =
		value ?? false;
}
