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
	 * The default containers for each position.
	 * These are the containers that are either specified by the user or created as a fallback.
	 *
	 * We store the definition of these containers here, to be able to adjust them later if needed.
	 */
	defaultContainers: Record<
		AppBuilderStandardContainerNameType,
		IAppBuilderContainer | undefined
	>;

	/**
	 * The additional content for containers.
	 * This includes all elements that should be added to the default container with the AppBuilderStandardContainerNameType.
	 *
	 * There are already created elements that can just be added to the container.
	 */
	additionalContainerContent: Record<
		AppBuilderStandardContainerNameType,
		Record<string, JSX.Element>
	>;

	/**
	 * The merged containers for each position.
	 * These are the containers that result from combining the default containers with the additional content.
	 * This property is updated whenever the default containers or additional content change.
	 */
	mergedContainers: Record<
		AppBuilderStandardContainerNameType,
		IAppBuilderContainer | undefined
	>;

	/**
	 * Set the default container definition for a specific position.
	 *
	 * @param position - The position for which to set the default container.
	 * @param container - The container definition to set as the default.
	 * @returns
	 */
	setDefaultContainer: (
		position: AppBuilderStandardContainerNameType,
		container: IAppBuilderContainer | undefined,
	) => void;

	/**
	 * Reset the default container definitions to their initial state.
	 * This will remove any user-defined containers and restore the default containers.
	 */
	resetDefaultContainers: () => void;

	/**
	 * Add an additional container for a specific position.
	 *
	 * @param position - The position for which to add the additional container.
	 * @param container - The additional container element to add.
	 * @returns A unique token representing the added container.
	 */
	addAdditionalContainer: (
		position: AppBuilderStandardContainerNameType,
		container: JSX.Element,
	) => string;

	/**
	 * Remove an additional container for a specific position.
	 *
	 * @param token - The unique token representing the added container.
	 * @returns A boolean indicating whether the container was successfully removed.
	 */
	removeAdditionalContainer: (token: string) => boolean;
}
