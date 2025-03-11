import Icon from "@AppBuilderShared/components/ui/Icon";
import TooltipWrapper from "@AppBuilderShared/components/ui/TooltipWrapper";
import {IconType} from "@AppBuilderShared/types/shapediver/icons";
import {BoxProps, Stack, Tabs} from "@mantine/core";
import React, {ReactElement, useEffect, useState} from "react";

interface PropsTab extends BoxProps {
	/** Name (value) of tab. */
	name: string;
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
}

export default function TabsComponent({
	defaultValue,
	tabs,
	...rest
}: ITabsComponentProps) {
	const [activeTab, setActiveTab] = useState<string | null>(defaultValue);
	const tabNames = tabs.map((tab) => tab.name);

	useEffect(() => {
		if (!activeTab || !tabNames.includes(activeTab)) {
			if (tabNames.includes(defaultValue)) {
				setActiveTab(defaultValue);
			} else {
				setActiveTab(tabNames[0]);
			}
		}
	}, [tabNames.join(""), defaultValue]);

	return tabs.length === 0 ? (
		<></>
	) : (
		<Tabs {...rest} value={activeTab} onChange={setActiveTab}>
			<Tabs.List>
				{tabs.map((tab, index) => {
					const tabsTab = (
						<Tabs.Tab
							key={index}
							value={tab.name}
							leftSection={
								tab.icon ? <Icon type={tab.icon} /> : undefined
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
				const {name, icon, children, ...rest} = tab;

				return (
					<Tabs.Panel {...rest} key={index} value={name}>
						<Stack>{children}</Stack>
					</Tabs.Panel>
				);
			})}
		</Tabs>
	);
}
