import { Button, Group, Loader, Space, Stack, Text } from "@mantine/core";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ParameterLabelComponent from "./ParameterLabelComponent";
import { PropsParameter } from "../../../types/components/shapediver/propsParameter";
import { useParameterComponentCommons } from "../../../hooks/shapediver/parameters/useParameterComponentCommons";
import { GumballParameterValue, IGumballParameterProps } from "@shapediver/viewer";
import { useGumball } from "../../../hooks/shapediver/viewer/interaction/gumball/useGumball";
import { IconTypeEnum } from "../../../types/shapediver/icons";
import Icon from "../../ui/Icon";
import { useViewportId } from "../../../hooks/shapediver/viewer/useViewportId";

/**
 * Parse the value of a gumball parameter and extract the transformed node names.
 * @param value 
 * @returns 
 */
const parseTransformation = (value?: string): { name: string, transformation: number[] }[] => {
	if (!value) return [];
	try {
		const parsed: {
			names: string[],
			transformations: number[][]
		} = JSON.parse(value);

		return parsed.names.map((name, i) => ({ name, transformation: parsed.transformations[i] }));
	}
	catch (e) {
		return [];
	}
};

/**
 * Functional component that creates a switch component for a gumball parameter.
 *
 * @returns
 */
export default function ParameterGumballComponent(props: PropsParameter) {
	const {
		definition,
		handleChange,
		onCancel,
		disabled,
		value,
		state
	} = useParameterComponentCommons<string>(props);

	const gumballProps = definition.settings?.props as IGumballParameterProps;

	// state for the gumball application
	const [gumballActive, setGumballActive] = useState<boolean>(false);

	const { viewportId } = useViewportId();

	// get the transformed nodes and the selected nods
	const { transformedNodeNames, setTransformedNodeNames, setSelectedNodeNames, clearTransformedNodeNames } = useGumball(
		props.sessionId, 
		viewportId, 
		gumballProps,
		gumballActive,
		parseTransformation(value)
	);

	/**
	 * Callback function to change the value of the parameter.
	 * This function is called when the gumball interaction is confirmed.
	 * It also ends the gumball interaction process and resets the selected nodes.
	 */
	const changeValue = useCallback((transformedNodeNames: { name: string, transformation: number[] }[]) => {
		setGumballActive(false);
		const parameterValue: GumballParameterValue = { 
			names: transformedNodeNames.map(node => node.name), 
			transformations: transformedNodeNames.map(node => node.transformation) 
		};
		handleChange(JSON.stringify(parameterValue), 0);
		setSelectedNodeNames([]);
	}, []);


	// store the transformed nodes in a ref to access them in the resetTransformation function
	const transformedNodeNamesRef = useRef(transformedNodeNames);
	useEffect(() => {
		transformedNodeNamesRef.current = transformedNodeNames;
	}, [transformedNodeNames]);

	/**
	 * Callback function to reset the transformed nodes.
	 * This function is called when the gumball interaction is aborted by the user.
	 * If a value is provided, the transformed nodes are reset to the provided value.
	 * It also ends the gumball.
	 */
	const resetTransformation = useCallback(() => {
		clearTransformedNodeNames(transformedNodeNamesRef.current);
		setGumballActive(false);
		setSelectedNodeNames([]);
	}, []);


	// react to changes of the uiValue and update the gumball state if necessary
	useEffect(() => {
		const parsed = parseTransformation(state.uiValue);
		// compare names to selectedNodeNames
		if (parsed.length !== transformedNodeNames.length || 
			!parsed.every((n, i) => n === transformedNodeNames[i]) ||
			!parsed.every((n, i) => n.transformation.every((t, j) => t === transformedNodeNames[i].transformation[j]))
		) {
			console.log("update transformed nodes", parsed);
			setGumballActive(false);
			setTransformedNodeNames(parsed);
			setSelectedNodeNames([]);
		}
	}, [state.uiValue]); 

	// extend the onCancel callback to reset the transformed nodes.
	const _onCancel = useMemo(() => onCancel ? () =>{
		resetTransformation();
		onCancel?.();
	} : undefined, [onCancel]);

	/**
	 * The content of the parameter when it is active.
	 * 
	 * It contains a button to confirm the gumball interaction and a button to cancel the interaction.
	 * 
	 * The confirm button sets the current parameter value to the transformed nodes.
	 * The cancel button resets the transformed nodes to the last value.
	 * 
	 */
	const contentActive =
		<Stack>
			<Button justify="space-between" fullWidth h="100%" disabled={disabled}
				rightSection={<Loader type="dots" />}
				onClick={_onCancel}
			>
				<Stack>
					<Space />
					<Text size="sm" fw={500} ta="left">
						Currently transformed: {transformedNodeNames.length}
					</Text>
					<Text size="sm" fw={400} fs="italic" ta="left">
						Select objects to transform
					</Text>
					<Space />
				</Stack>
			</Button>

			<Group justify="space-between" w="100%" wrap="nowrap">
				<Button
					disabled={transformedNodeNames.length === 0}
					fullWidth={true}
					variant="filled"
					onClick={() => changeValue(transformedNodeNames)}
				>
					<Text>Confirm</Text>
				</Button>
				<Button
					fullWidth={true}
					variant={"light"}
					onClick={_onCancel}>
					<Text>Cancel</Text>
				</Button>
			</Group>
		</Stack>;


	/**
	 * The content of the parameter when it is inactive.
	 * 
	 * It contains a button to start the gumball.
	 * Within the button, the number of transformed nodes is displayed.
	 */
	const contentInactive =
		<Button justify="space-between" fullWidth={true} disabled={disabled}
			rightSection={<Icon type={IconTypeEnum.IconHandFinger} />}
			variant={transformedNodeNames.length === 0 ? "light" : "filled"}
			onClick={() => setGumballActive(true)}>
			<Text size="sm">
				Start gumball
			</Text>
		</Button>;

	return <>
		<ParameterLabelComponent {...props} cancel={_onCancel} />
		{
			definition &&
				gumballActive ? contentActive : contentInactive
		}
	</>;
}