import {IAppBuilderContainer} from "@AppBuilderShared/types/shapediver/appbuilder";
import {
	AppBuilderStandardContainerNames,
	AppBuilderStandardContainerNameType,
	IShapeDiverStoreStandardContainers,
} from "@AppBuilderShared/types/store/shapediverStoreStandardContainers";
import {create} from "zustand";
import {devtools} from "zustand/middleware";

/**
 * Helper function to merge default and additional containers.
 *
 * @param name - The name for which to merge containers.
 * @param defaultContainer - The default container definition.
 * @param additionalContainers - The additional container elements to merge.
 * @returns The merged container definition.
 */
const merge = (
	name: AppBuilderStandardContainerNameType,
	defaultContainer: IAppBuilderContainer | undefined,
	additionalContainers: Record<string, JSX.Element>,
): IAppBuilderContainer | undefined => {
	// Return undefined if no default container and no additional containers
	if (!defaultContainer && Object.keys(additionalContainers).length === 0) {
		return undefined;
	}

	// Start with base container or create new one
	const baseContainer = defaultContainer || {
		name: name,
		tabs: [],
		widgets: [],
	};

	// Collect all additional container elements
	const allAdditionalItems = Object.values(additionalContainers);

	// Return the default container if no additional items are present
	if (allAdditionalItems.length === 0) {
		return baseContainer;
	}

	// Create new tabs array with proper immutability
	let newTabs = [...(baseContainer.tabs || [])];
	let newWidgets = [...(baseContainer.widgets || [])];

	// If there is a tab present, we need to add the additional items to the first tab
	// Otherwise we add them to the main widget array
	if (baseContainer.tabs && baseContainer.tabs.length > 0) {
		// Create new tab object instead of mutating
		newTabs[0] = {
			...newTabs[0],
			widgets: [...allAdditionalItems, ...(newTabs[0].widgets || [])],
		};
	} else {
		newWidgets = [...allAdditionalItems, ...newWidgets];
	}

	return {
		...baseContainer,
		tabs: newTabs,
		widgets: newWidgets,
	};
};

/**
 * Update the merged containers based on the current default and additional container content.
 *
 * @param defaultContainers The current default container definitions.
 * @param additionalContainerContent The current additional container content.
 * @returns The updated merged container definitions.
 */
const updateMergedContainers = (
	defaultContainers: Record<
		AppBuilderStandardContainerNameType,
		IAppBuilderContainer | undefined
	>,
	additionalContainerContent: Record<
		AppBuilderStandardContainerNameType,
		Record<string, JSX.Element>
	>,
): Record<
	AppBuilderStandardContainerNameType,
	IAppBuilderContainer | undefined
> => {
	const result: Record<
		AppBuilderStandardContainerNameType,
		IAppBuilderContainer | undefined
	> = {} as any;
	for (const name of AppBuilderStandardContainerNames) {
		result[name] = merge(
			name,
			defaultContainers[name],
			additionalContainerContent[name],
		);
	}
	return result;
};

export const useShapeDiverStoreStandardContainers =
	create<IShapeDiverStoreStandardContainers>()(
		devtools(
			(set, get) => ({
				defaultContainers: {
					top: undefined,
					bottom: undefined,
					left: undefined,
					right: undefined,
				},
				additionalContainerContent: {
					top: {},
					bottom: {},
					left: {},
					right: {},
				},
				mergedContainers: {
					top: undefined,
					bottom: undefined,
					left: undefined,
					right: undefined,
				},

				setDefaultContainer: (name, container) =>
					set(
						(state) => {
							const newDefaultContainers = {
								...state.defaultContainers,
								[name]: container,
							};
							return {
								defaultContainers: newDefaultContainers,
								mergedContainers: updateMergedContainers(
									newDefaultContainers,
									state.additionalContainerContent,
								),
							};
						},
						false,
						`setDefaultContainer-${name}`,
					),

				setDefaultContainers: (containers) =>
					set(
						(state) => {
							const newDefaultContainers = {
								...state.defaultContainers,
								...containers,
							};
							return {
								defaultContainers: newDefaultContainers,
								mergedContainers: updateMergedContainers(
									newDefaultContainers,
									state.additionalContainerContent,
								),
							};
						},
						false,
						`setDefaultContainers`,
					),

				resetDefaultContainers: () =>
					set(
						(state) => {
							const newDefaultContainers = {
								top: undefined,
								bottom: undefined,
								left: undefined,
								right: undefined,
							};
							return {
								defaultContainers: newDefaultContainers,
								mergedContainers: updateMergedContainers(
									newDefaultContainers,
									state.additionalContainerContent,
								),
							};
						},
						false,
						"resetDefaultContainers",
					),

				// Additional container actions
				addAdditionalContainerContent: (name, content) => {
					const token = Math.random().toString(36).substring(7);

					set(
						(state) => {
							const newAdditionalContent = {
								...state.additionalContainerContent,
								[name]: {
									...state.additionalContainerContent[name],
									[token]: content,
								},
							};
							return {
								additionalContainerContent:
									newAdditionalContent,
								mergedContainers: updateMergedContainers(
									state.defaultContainers,
									newAdditionalContent,
								),
							};
						},
						false,
						`addAdditionalContainerContent-${name}-${token}`,
					);

					return token;
				},

				removeAdditionalContainerContent: (token) => {
					const state = get();
					let found = false;
					let targetName: AppBuilderStandardContainerNameType | null =
						null;

					// Find which name contains the token
					for (const name of AppBuilderStandardContainerNames) {
						if (state.additionalContainerContent[name][token]) {
							found = true;
							targetName = name;
							break;
						}
					}

					// If not found, return false
					if (!found || !targetName) {
						return false;
					}

					set(
						(state) => {
							const newAdditionalContent = {
								...state.additionalContainerContent,
								[targetName!]: Object.fromEntries(
									Object.entries(
										state.additionalContainerContent[
											targetName!
										],
									).filter(([key]) => key !== token),
								),
							};
							return {
								additionalContainerContent:
									newAdditionalContent,
								mergedContainers: updateMergedContainers(
									state.defaultContainers,
									newAdditionalContent,
								),
							};
						},
						false,
						`removeAdditionalContainerContent-${token}`,
					);

					return true;
				},
			}),
			{
				name: "shapediver-containers",
			},
		),
	);
