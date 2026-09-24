import {IAppBuilderStandardContainer} from "@AppBuilderLib/features/appbuilder/config/appbuilder";
import {
	AdditionalContainerItem,
	AppBuilderStandardContainerNames,
	AppBuilderStandardContainerNameType,
	IShapeDiverStoreStandardContainers,
} from "@AppBuilderLib/features/appbuilder/config/shapediverStoreStandardContainers";
import {mergeAllStandardContainers} from "@AppBuilderLib/features/appbuilder/lib/mergeStandardContainerContent";
import {create} from "zustand";
import {devtools} from "zustand/middleware";

/**
 * Update the merged containers based on the current default and additional container content.
 */
const generateToken = () => Math.random().toString(36).slice(2);

const updateMergedContainers = (
	defaultContainers: Record<
		AppBuilderStandardContainerNameType,
		IAppBuilderStandardContainer | undefined
	>,
	additionalContainerContent: Record<
		AppBuilderStandardContainerNameType,
		Record<string, AdditionalContainerItem>
	>,
	activeTabIndices: Record<AppBuilderStandardContainerNameType, number>,
): Record<
	AppBuilderStandardContainerNameType,
	IAppBuilderStandardContainer | undefined
> =>
	mergeAllStandardContainers(
		defaultContainers,
		additionalContainerContent,
		activeTabIndices,
	);

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
				activeTabIndices: {
					top: 0,
					bottom: 0,
					left: 0,
					right: 0,
				},
				containerOpen: {
					top: true,
					bottom: true,
					left: true,
					right: true,
				},

				setActiveTab: (containerName, tabIndex) =>
					set(
						(state) => {
							const newActiveTabIndices = {
								...state.activeTabIndices,
								[containerName]: tabIndex,
							};
							return {
								activeTabIndices: newActiveTabIndices,
								mergedContainers: updateMergedContainers(
									state.defaultContainers,
									state.additionalContainerContent,
									newActiveTabIndices,
								),
							};
						},
						false,
						`setActiveTab-${containerName}-${tabIndex}`,
					),

				setContainerOpen: (containerName, open) =>
					set(
						(state) => ({
							containerOpen: {
								...state.containerOpen,
								[containerName]: open,
							},
						}),
						false,
						`setContainerOpen-${containerName}-${open}`,
					),

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
									state.activeTabIndices,
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
									state.activeTabIndices,
								),
							};
						},
						false,
						"setDefaultContainers",
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
									state.activeTabIndices,
								),
							};
						},
						false,
						"resetDefaultContainers",
					),

				// Additional container actions
				addAdditionalContainerContent: (name, content, options) => {
					const token = generateToken();
					const item: AdditionalContainerItem = {
						content,
						position: options?.position,
						order: options?.order,
					};

					set(
						(state) => {
							const newAdditionalContent = {
								...state.additionalContainerContent,
								[name]: {
									...state.additionalContainerContent[name],
									[token]: item,
								},
							};
							return {
								additionalContainerContent:
									newAdditionalContent,
								mergedContainers: updateMergedContainers(
									state.defaultContainers,
									newAdditionalContent,
									state.activeTabIndices,
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
									state.activeTabIndices,
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
