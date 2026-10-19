import {IAppBuilderStandardContainer} from "@AppBuilderLib/features/appbuilder/config/appbuilder";
import {
	AdditionalContainerItem,
	AppBuilderStandardContainerNames,
	AppBuilderStandardContainerNameType,
} from "@AppBuilderLib/features/appbuilder/config/shapediverStoreStandardContainers";

export type AdditionalContainerContentMap = Record<
	AppBuilderStandardContainerNameType,
	Record<string, AdditionalContainerItem>
>;

export type StandardContainersMap = Record<
	AppBuilderStandardContainerNameType,
	IAppBuilderStandardContainer | undefined
>;

/**
 * Merge default JSON content with additional items.
 * Additional items with `position: "before"` are prepended to native widgets
 * (or the active tab’s widgets). Everything else is appended.
 */
export function mergeStandardContainerContent(
	name: AppBuilderStandardContainerNameType,
	defaultContainer: IAppBuilderStandardContainer | undefined,
	additionalContainers: Record<string, AdditionalContainerItem>,
	activeTabIndex: number,
): IAppBuilderStandardContainer | undefined {
	if (!defaultContainer && Object.keys(additionalContainers).length === 0) {
		return undefined;
	}

	const baseContainer = defaultContainer || {
		name: name,
		tabs: [],
		widgets: [],
	};

	const entries = Object.entries(additionalContainers);
	if (entries.length === 0) {
		return baseContainer;
	}

	const sorted = entries
		.map(([token, item], index) => ({
			token,
			index,
			content: item.content,
			position: item.position ?? "after",
			order: item.order ?? 0,
		}))
		.sort((a, b) => {
			if (a.order !== b.order) {
				return a.order - b.order;
			}
			return a.index - b.index;
		});
	const befores = sorted
		.filter((item) => item.position === "before")
		.map((item) => item.content);
	const afters = sorted
		.filter((item) => item.position !== "before")
		.map((item) => item.content);

	const newTabs = [...(baseContainer.tabs || [])];
	let newWidgets = [...(baseContainer.widgets || [])];

	if (baseContainer.tabs && baseContainer.tabs.length > 0) {
		const tabIndex = Math.min(
			Math.max(activeTabIndex, 0),
			newTabs.length - 1,
		);
		newTabs[tabIndex] = {
			...newTabs[tabIndex],
			widgets: [
				...befores,
				...(newTabs[tabIndex].widgets || []),
				...afters,
			] as NonNullable<IAppBuilderStandardContainer["widgets"]>,
		};
	} else {
		newWidgets = [...befores, ...newWidgets, ...afters] as NonNullable<
			IAppBuilderStandardContainer["widgets"]
		>;
	}

	return {
		...baseContainer,
		tabs: newTabs,
		widgets: newWidgets,
	};
}

export function mergeAllStandardContainers(
	defaults: StandardContainersMap,
	additional: AdditionalContainerContentMap,
	activeTabIndices: Record<AppBuilderStandardContainerNameType, number>,
): StandardContainersMap {
	const result: StandardContainersMap = {
		left: undefined,
		right: undefined,
		top: undefined,
		bottom: undefined,
	};
	for (const name of AppBuilderStandardContainerNames) {
		result[name] = mergeStandardContainerContent(
			name,
			defaults[name],
			additional[name],
			activeTabIndices[name],
		);
	}
	return result;
}
