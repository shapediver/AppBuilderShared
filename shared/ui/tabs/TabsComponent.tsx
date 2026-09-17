import Icon from "@AppBuilderLib/shared/ui/icon/Icon";
import {IconType} from "@AppBuilderLib/shared/ui/icon/Icon.types";
import TooltipWrapper from "@AppBuilderLib/shared/ui/tooltip/TooltipWrapper";
import {BoxProps, Stack, Tabs} from "@mantine/core";
import {
	ButtonHTMLAttributes,
	ReactElement,
	useEffect,
	useRef,
	useState,
} from "react";

interface PropsTab extends BoxProps {
	/** Value of tab. */
	value?: string;
	/** Optional name (value) of tab. */
	name?: string;
	/** Optional icon of tab. */
	icon?: IconType;
	/** Children of tab. */
	children: ReactElement[];
	/** Optional tooltip to show when hovering the tab. */
	tooltip?: string;
	/**
	 * Optional DOM handlers on the tab control. Typed as full button attributes
	 * so `uiSlotDomProps` can add events without updating this component.
	 */
	controlProps?: ButtonHTMLAttributes<HTMLButtonElement>;
}

export interface ITabsComponentProps extends BoxProps {
	/** Value of default tab. */
	defaultValue: string;
	/** The tabs. */
	tabs: PropsTab[];
	/** Optional callback when active tab changes */
	onActiveTabChange?: (tabIndex: number) => void;
	/** When true, the tab list stays sticky at the top of the scrollable container */
	stickyTabs?: boolean;
}

const getTabValue = (props: PropsTab, index: number) => {
	return props.value || props.name || index.toString();
};

export default function TabsComponent({
	defaultValue,
	tabs,
	onActiveTabChange,
	stickyTabs,
	...rest
}: ITabsComponentProps) {
	const tabValues = tabs.map((tab, index) => getTabValue(tab, index));
	const initialActiveTab = tabValues.includes(defaultValue)
		? defaultValue
		: (tabValues[0] ?? null);
	const [activeTab, setActiveTab] = useState<string | null>(initialActiveTab);
	// keepMounted=false prop unmount the tab when it is not active
	const activeTabsHistory = useRef(
		new Set<string>(initialActiveTab ? [initialActiveTab] : []),
	);
	const handleActiveTabChange = (value: string | null) => {
		setActiveTab(value);
		if (value) {
			activeTabsHistory.current.add(value);
			// Notify parent component of tab change
			if (onActiveTabChange) {
				const tabIndex = tabValues.findIndex(
					(tabValue) => tabValue === value,
				);
				if (tabIndex !== -1) onActiveTabChange(tabIndex);
			}
		}
	};

	useEffect(() => {
		if (!activeTab || !tabValues.includes(activeTab)) {
			const nextActiveTab = tabValues.includes(defaultValue)
				? defaultValue
				: (tabValues[0] ?? null);

			setActiveTab(nextActiveTab);
			if (nextActiveTab) activeTabsHistory.current.add(nextActiveTab);
		}
	}, [activeTab, tabValues.join("\u0000"), defaultValue]);

	return tabs.length === 0 ? (
		<></>
	) : (
		<Tabs {...rest} value={activeTab} onChange={handleActiveTabChange}>
			<Tabs.List
				style={
					stickyTabs
						? {
								position: "sticky",
								top: 0,
								zIndex: 5,
								backgroundColor: "var(--mantine-color-body)",
							}
						: undefined
				}
			>
				{tabs.map((tab, index) => {
					const tabsTab = (
						<Tabs.Tab
							key={index}
							{...tab.controlProps}
							value={getTabValue(tab, index)}
							leftSection={
								tab.icon ? (
									<Icon iconType={tab.icon} />
								) : undefined
							}
						>
							{tab.name}
						</Tabs.Tab>
					);

					return tab.tooltip ? (
						<TooltipWrapper key={index} label={tab.tooltip}>
							{tabsTab}
						</TooltipWrapper>
					) : (
						tabsTab
					);
				})}
			</Tabs.List>
			{tabs.map((tab, index) => {
				const {
					value: _value,
					name: _name,
					icon: _icon,
					children,
					controlProps: _controlProps,
					...rest
				} = tab;

				return (
					<Tabs.Panel
						{...rest}
						key={index}
						value={getTabValue(tab, index)}
					>
						{activeTabsHistory.current.has(
							getTabValue(tab, index),
						) && <Stack>{children}</Stack>}
					</Tabs.Panel>
				);
			})}
		</Tabs>
	);
}
