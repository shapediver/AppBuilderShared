import {Gradient} from "@shapediver/viewer.features.attribute-visualization";
import {ISDTFOverview} from "@shapediver/viewer.session";
import {useEffect, useState} from "react";

export type Attributes = (
	| string
	| {
			attribute: string;
			gradient?: Gradient;
	  }
)[];

export const useConvertAttributeInputData = (
	attributeOverview: ISDTFOverview | undefined,
	propsAttributes: Attributes | undefined,
) => {
	const [attributes, setAttributes] = useState<Attributes | undefined>();

	/**
	 * Use effect that assigns the attributes state variable
	 * This is done by checking if the attributes are provided in the props
	 * or if the attribute overview is available
	 */
	useEffect(() => {
		if (attributeOverview === undefined) return;

		const attributeIds: string[] = [];

		Object.keys(attributeOverview).map((key) => {
			const ids = createAttributeId(key, attributeOverview);
			attributeIds.push(...ids);
		});

		const providedAttributesCleaned = propsAttributes
			? propsAttributes
					.map((value) => {
						if (typeof value === "string") {
							return createAttributeId(value, attributeOverview);
						} else {
							return createAttributeId(
								value.attribute,
								attributeOverview,
							).map((id) => {
								return {
									attribute: id,
									gradient: value.gradient,
								};
							});
						}
					})
					.flat()
			: undefined;

		setAttributes(providedAttributesCleaned || attributeIds);
	}, [propsAttributes, attributeOverview]);

	return {
		attributes,
	};
};

/**
 * Function to create the attribute id
 * This is done by checking if the attribute is available in the overview
 * and if not, it tries to find the attribute by its key and type hint
 * If not found, undefined is returned
 * The gradient is also assigned to the attribute
 * @param key
 * @param overview
 * @returns {string[]}
 */
export const createAttributeId = (
	key: string,
	overview: ISDTFOverview,
): string[] => {
	if (!overview[key]) return [];

	const attribute = overview[key];
	return attribute.map((v) => {
		return key + "_" + v.typeHint;
	});
};
