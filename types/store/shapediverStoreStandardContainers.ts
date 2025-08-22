import {
	AppBuilderContainerNameType,
	IAppBuilderContainer,
} from "../shapediver/appbuilder";

/**
 * Type representing the standard container names in the app builder.
 * This is used to filter out the viewport anchor 2d and 3d (and potentially other future anchors).
 */
export type AppBuilderStandardContainerNameType =
	| AppBuilderContainerNameType.Left
	| AppBuilderContainerNameType.Right
	| AppBuilderContainerNameType.Top
	| AppBuilderContainerNameType.Bottom;

/**
 * List of all standard container names in the app builder.
 * These are used to identify and manage the layout of the app builder interface.
 */
export const AppBuilderStandardContainerNames: readonly AppBuilderStandardContainerNameType[] =
	[
		AppBuilderContainerNameType.Left,
		AppBuilderContainerNameType.Right,
		AppBuilderContainerNameType.Top,
		AppBuilderContainerNameType.Bottom,
	];

export interface IShapeDiverStoreStandardContainers {
	/**
	 * The default container state for each of the standard container names.
	 * This container state is defined by the AppBuilder output of the controller session, or the fallback logic in case no AppBuilder output exists.
	 *
	 * We store the definition of these containers here, to be able to adjust them later if needed.
	 */
	defaultContainers: Record<
		AppBuilderStandardContainerNameType,
		IAppBuilderContainer | undefined
	>;

	/**
	 * The additional content to be added to the default container state.
	 * This includes all elements that should be added to the default container with the corresponding type.
	 *
	 * There are already created elements that can just be added to the container.
	 */
	additionalContainerContent: Record<
		AppBuilderStandardContainerNameType,
		Record<string, JSX.Element>
	>;

	/**
	 * The merged containers for each name.
	 * These are the containers that result from combining the default containers with the additional content.
	 * This property is updated whenever the default containers or additional content change.
	 */
	mergedContainers: Record<
		AppBuilderStandardContainerNameType,
		IAppBuilderContainer | undefined
	>;

	/**
	 * Set the default container definition for a specific name.
	 *
	 * @param name - The name for which to set the default container.
	 * @param container - The container definition to set as the default.
	 * @returns
	 */
	setDefaultContainer: (
		name: AppBuilderStandardContainerNameType,
		container: IAppBuilderContainer | undefined,
	) => void;

	/**
	 * Set the default container definitions for all names.
	 *
	 * @param containers - The container definitions to set as the default.
	 * @returns
	 */
	setDefaultContainers: (
		containers: Record<
			AppBuilderStandardContainerNameType,
			IAppBuilderContainer | undefined
		>,
	) => void;

	/**
	 * Reset the default container definitions to their initial state.
	 * This will remove any user-defined containers and restore the default containers.
	 */
	resetDefaultContainers: () => void;

	/**
	 * Add an additional container for a specific name.
	 *
	 * @param name - The name for which to add the additional container.
	 * @param content - The additional content to add.
	 * @returns A unique token representing the added container.
	 */
	addAdditionalContainerContent: (
		name: AppBuilderStandardContainerNameType,
		content: JSX.Element,
	) => string;

	/**
	 * Remove an additional container for a specific name.
	 *
	 * @param token - The unique token representing the added container.
	 * @returns A boolean indicating whether the container was successfully removed.
	 */
	removeAdditionalContainerContent: (token: string) => boolean;
}
