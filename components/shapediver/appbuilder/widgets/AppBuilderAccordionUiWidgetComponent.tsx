import AppBuilderWidgetsComponent from "@AppBuilderShared/components/shapediver/appbuilder/widgets/AppBuilderWidgetsComponent";
import Icon from "@AppBuilderShared/components/ui/Icon";
import {IAppBuilderWidgetPropsAccordionUi} from "@AppBuilderShared/types/shapediver/appbuilder";
import {Accordion} from "@mantine/core";
import React, {useEffect, useState} from "react";

type Props = IAppBuilderWidgetPropsAccordionUi & {
	namespace: string;
};

export default function AppBuilderAccordionUiWidgetComponent({
	namespace,
	items,
	multiple,
	defaultValue,
	value,
}: Props) {
	// Local state for uncontrolled mode
	const [localValue, setLocalValue] = useState<
		string | string[] | null | undefined
	>(defaultValue || null);

	const handleValueChange = (newValue: string | string[] | null) => {
		// Update local state (uncontrolled mode)
		setLocalValue(newValue);
	};

	useEffect(() => {
		setLocalValue(value);
	}, [value]);

	return (
		<Accordion
			value={localValue}
			onChange={handleValueChange}
			multiple={multiple || false}
		>
			{items.map((item, index) => (
				<Accordion.Item key={index} value={item.value || item.name}>
					<Accordion.Control
						icon={
							item.icon ? (
								<Icon iconType={item.icon} />
							) : undefined
						}
						title={item.tooltip}
					>
						{item.name}
					</Accordion.Control>
					<Accordion.Panel>
						<AppBuilderWidgetsComponent
							namespace={namespace}
							widgets={item.widgets}
						/>
					</Accordion.Panel>
				</Accordion.Item>
			))}
		</Accordion>
	);
}
