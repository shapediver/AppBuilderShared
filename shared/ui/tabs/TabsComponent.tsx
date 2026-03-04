import {Icon, IconType} from "@AppBuilderLib/shared/ui/icon";
import {TooltipWrapper} from "@AppBuilderLib/shared/ui/tooltip";
import {BoxProps, Stack, Tabs} from "@mantine/core";
import React, {ReactElement, useEffect, useRef, useState} from "react";

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
}

export interface ITabsComponentProps extends BoxProps {
	/** Value of default tab. */
	defaultValue: string;
	/** The tabs. */
	tabs: PropsTab[];
	/** Optional callback when active tab changes */
	onActiveTabChange?: (tabIndex: number) => void;
}

const getTabValue = (props: PropsTab, index: number) => {
	return props.value || props.name || index.toString();
};

export default function TabsComponent({
	defaultValue,
	tabs,
	onActiveTabChange,
	...rest
}: ITabsComponentProps) {
	const [activeTab, setActiveTab] = useState<string | null>(defaultValue);
	// keepMounted=false prop unmount the tab when it is not active
	const activeTabsHistory = useRef(new Set<string>([defaultValue]));
	const tabValues = tabs.map((tab, index) => getTabValue(tab, index));
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
			if (tabValues.includes(defaultValue)) {
				setActiveTab(defaultValue);
			} else {
				setActiveTab(tabValues[0]);
			}
		}
	}, [tabValues.join(""), defaultValue]);

	return tabs.length === 0 ? (
		<></>
	) : (
		<Tabs {...rest} value={activeTab} onChange={handleActiveTabChange}>
			<Tabs.List>
				{tabs.map((tab, index) => {
					const tabsTab = (
						<Tabs.Tab
							key={index}
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
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				const {value, name, icon, children, ...rest} = tab;

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
