import Icon from "@AppBuilderShared/components/ui/Icon";
import {Attributes} from "@AppBuilderShared/hooks/shapediver/viewer/attributeVisualization/useConvertAttributeInputData";
import {IconTypeEnum} from "@AppBuilderShared/types/shapediver/icons";
import {ActionIcon, Stack, Table} from "@mantine/core";
import {ISDTFAttributeData} from "@shapediver/viewer.session";
import React, {useMemo} from "react";
import {IAttributeDefinition} from "../appbuilder/widgets/AppBuilderAttributeVisualizationWidgetComponent";
import classes from "./SelectedAttributeComponent.module.css";

type Props = {
	attributes?: Attributes;
	selectedItemData?: {
		[key: string]: ISDTFAttributeData;
	};
	renderedAttribute?: IAttributeDefinition;
	handleAttributeChange?: (attributeId: string) => void;
};

type SelectedAttributeData = {
	[key: string]: {
		value: string;
		typeHint: string;
		ableToActivate: boolean;
		currentlyActive: boolean;
	};
};

export default function SelectedAttributeComponent(props: Props) {
	const {
		attributes,
		selectedItemData,
		renderedAttribute,
		handleAttributeChange,
	} = props;

	/**
	 * Create the attribute data to show in the table.
	 * If no attributes are provided, we show all attributes from the selected item data.
	 * If attributes are provided, we only show the attributes that are in the attributes array.
	 * We also check if the rendered attribute is active and set the currentlyActive property accordingly
	 * which results in the eye icon being shown in the last column.
	 */
	const attributeDataToShow: SelectedAttributeData = useMemo(() => {
		if (!selectedItemData) return {};
		// If no attributes are provided, we show all attributes from the selected item data.
		if (!attributes) {
			// show them all
			// as we don't know which attributes are specified, we set the ableToActivate property to false
			return Object.entries(selectedItemData).reduce(
				(acc, [key, value]) => {
					acc[key] = {
						value: value.value as string,
						typeHint: value.typeHint,
						ableToActivate: false,
						currentlyActive:
							renderedAttribute?.key === key &&
							renderedAttribute?.type === value.typeHint,
					};
					return acc;
				},
				{} as SelectedAttributeData,
			);
		}
		// If attributes are provided, we only show the attributes that are in the attributes array of the selected item.
		// We also check if the rendered attribute is active and set the currentlyActive property accordingly
		// which results in the eye icon being shown in the last column.
		const attributeKeys = attributes
			.map((attribute) => {
				const realKey =
					typeof attribute === "string"
						? getAttributeKey(attribute, selectedItemData)
						: getAttributeKey(
								attribute.attribute,
								selectedItemData,
							);
				if (!realKey) return undefined;
				const value = selectedItemData[realKey];
				if (!value) return undefined;
				// as we know that these attributes are specified, we can set the ableToActivate property to true
				// and the currentlyActive property based on the rendered attribute
				return {
					[realKey]: {
						value: value.value as string,
						typeHint: value.typeHint,
						ableToActivate: true,
						currentlyActive:
							renderedAttribute?.key === realKey &&
							renderedAttribute?.type === value.typeHint,
					},
				};
			})
			.filter((key) => key !== undefined)
			.reduce((acc, curr) => {
				return {...acc, ...curr};
			}, {} as SelectedAttributeData);
		return attributeKeys;
	}, [attributes, renderedAttribute, selectedItemData]);

	/**
	 * Create the rows for the table.
	 * We map over the attributeDataToShow and create a row for each attribute.
	 * In the row, we show the key, the value and an eye icon if the attribute is able to be activated.
	 * If the attribute is currently active, we show the eye icon, otherwise we show an ActionIcon to activate it.
	 */
	const rows = Object.entries(attributeDataToShow).map(([key, value]) => (
		<Table.Tr
			key={key}
			bg={
				value.currentlyActive
					? "var(--mantine-primary-color-light)"
					: undefined
			}
		>
			<Table.Td className={classes.selectedAttributeTd}>{key}</Table.Td>
			<Table.Td className={classes.selectedAttributeTd}>
				{JSON.stringify(value.value)}
			</Table.Td>
			{value.ableToActivate && (
				<Table.Td align="center">
					{value.currentlyActive ? (
						<Icon type={IconTypeEnum.Eye} />
					) : (
						<ActionIcon
							title="Toggle Layer"
							size={"sm"}
							onClick={() => {
								if (!handleAttributeChange) return;
								handleAttributeChange(
									key + "_" + value.typeHint,
								);
							}}
							variant={"light"}
						>
							<Icon type={IconTypeEnum.EyeOff} />
						</ActionIcon>
					)}
				</Table.Td>
			)}
		</Table.Tr>
	));

	return (
		<>
			{selectedItemData && (
				<Stack>
					<Table
						style={{tableLayout: "fixed", width: "100%"}}
						highlightOnHover
					>
						<Table.Thead>
							<Table.Tr>
								<Table.Th style={{width: "25%"}}>Name</Table.Th>
								<Table.Th style={{width: "auto"}}>
									Value
								</Table.Th>
								{Object.values(attributeDataToShow).filter(
									(v) => v.ableToActivate,
								).length > 0 && (
									<Table.Th style={{width: "20%"}}>
										Show
									</Table.Th>
								)}
							</Table.Tr>
						</Table.Thead>
						<Table.Tbody>{rows}</Table.Tbody>
					</Table>
				</Stack>
			)}
		</>
	);
}

/**
 * Helper function to get the real key of an attribute from its id.
 * This is needed because the id can contain a type hint at the end, which is not part of the key in the selectedItemData.
 *
 * @param id The id of the attribute to get the key for.
 * @param data The data to search in.
 * @returns
 */
const getAttributeKey = (
	id: string,
	data?: {[key: string]: ISDTFAttributeData},
): string | undefined => {
	if (!data) return undefined;
	if (data[id]) {
		return id;
	} else {
		const parts = id.split("_");
		if (parts.length > 1) {
			// remove the last part of the attributeId
			// this is the type hint, which is not needed for the comparison
			const typeHint = parts.pop();
			// recombine the party in case of underscores in the key
			const attributeKey = parts.join("_");

			if (
				data[attributeKey] &&
				data[attributeKey].typeHint === typeHint
			) {
				return attributeKey;
			}
		}
	}
	return undefined;
};
