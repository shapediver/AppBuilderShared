import { Stack, Title, Table, ActionIcon } from "@mantine/core";
import { getNodesByName } from "@shapediver/viewer.features.interaction";
import { ISDTFAttributeData, ITreeNode, SessionApiData, SDTFItemData } from "@shapediver/viewer.session";
import React, { useState, useCallback, useEffect, useMemo } from "react";
import Icon from "shared/components/ui/Icon";
import { useSelection } from "shared/hooks/shapediver/viewer/interaction/selection/useSelection";
import { SessionUpdateCallbackHandler } from "shared/hooks/shapediver/viewer/useSessionUpdateCallback";
import { useShapeDiverStoreSession } from "shared/store/useShapeDiverStoreSession";
import { IconTypeEnum } from "shared/types/shapediver/icons";

interface SelectedAttributeProps {
	viewportId: string;
	active: boolean;
	selectedValues: string[];
	setSelectedValues: React.Dispatch<React.SetStateAction<string[]>>;
	removeAttribute: (key: string) => void;
}

/**
 * Component to be able to select an attribute from the viewer and show its values.
 * 
 * @param props 
 * @returns 
 */
export default function SelectedAttribute(props: SelectedAttributeProps) {
	const { viewportId, active, selectedValues, setSelectedValues, removeAttribute } = props;
	const sessions = useShapeDiverStoreSession(state => state.sessions);

	const[nameFilter, setNameFilter] = useState<{ [key: string]: string[] }>({});
	const [selectedItemData, setSelectedItemData] = useState<{
		[key: string]: ISDTFAttributeData;
	}>();

	/**
	 * Whenever the session is updated, the name filter is updated as well.
	 * We search for all nodes that have an SDTFItemData and add the name of the node to the name filter.
	 */
	const sessionCallback = useCallback((newNode?: ITreeNode) => {
		if (!newNode) return;
		
		const sessionApi = (newNode.data.find((data) => data instanceof SessionApiData) as SessionApiData).api;
		if (!sessionApi) return;

		const nameFilter: string[] = [];
		newNode.traverse((node) => {
			for(const data of node.data) {
				if(data instanceof SDTFItemData) {
					// get the name of the node and add it to the name filter
					const path = node.getPath().split(".");
					// remove the first two elements of the path, because they are the root and session name
					path.shift();
					path.shift();
					// replace the first element of the path with the output name
					const outputApi = sessionApi.outputs[path[0]];
					if(!outputApi) continue;
					path[0] = outputApi.name;
					nameFilter.push(path.join("."));
				}
			}
			
		});

		setNameFilter((prev) => {
			const newFilter = { ...prev };
			newFilter[sessionApi.id] = nameFilter;

			return newFilter;
		});

	}, [sessions]);

	const [sessionUpdateCallbackHandlers, setSessionUpdateCallbackHandlers] = useState<JSX.Element[]>([]);

	useEffect(() => {
		const sessionUpdateCallbackHandlers: JSX.Element[] = [];

		Object.keys(sessions).forEach(sessionId => {
			sessionUpdateCallbackHandlers.push(
				<SessionUpdateCallbackHandler
					key={sessionId}
					sessionId={sessionId}
					callbackId={sessionId}
					updateCallback={sessionCallback}
				/>);
		});

		setSessionUpdateCallbackHandlers(sessionUpdateCallbackHandlers);
	}, [sessions]);


	const selectionProps = useMemo(() => {
		return {
			maximumSelection: 1,
			minimumSelection: 1,
			nameFilter: Object.values(nameFilter).flat(),
			selectionColor: "#0d44f0",
			hover: true,
			hoverColor: "#00ff78"
		};
	}, [nameFilter]);

	const { selectedNodeNames, handlers } = useSelection(Object.keys(sessions), viewportId, selectionProps, active, undefined, false);

	useEffect(() => {
		if (selectedNodeNames.length > 0) {
			const nodes = getNodesByName(Object.values(sessions), selectedNodeNames, false);
			if(nodes.length > 0) {
				const node = nodes[0].node;
				const sdtfItemData = node.data.find((data) => data instanceof SDTFItemData);
				if(sdtfItemData) {
					setSelectedItemData(sdtfItemData.attributes);

					return;
				}
			}
		}

		setSelectedItemData(undefined);
	}, [selectedNodeNames]);


	return <>
		{sessionUpdateCallbackHandlers}
		{handlers}
		{
			selectedItemData && 
			<Stack>
				<Title order={5}> Selected Item </Title>
				<Table highlightOnHover withTableBorder>
					<Table.Thead>
						<Table.Tr>
							<Table.Th style={{ width: "20%", whiteSpace: "nowrap" }}>Name</Table.Th>
							<Table.Th style={{ width: "100%" }}>Value</Table.Th>
							<Table.Th style={{ width: "auto", whiteSpace: "nowrap" }}>Show</Table.Th>
						</Table.Tr>
					</Table.Thead>
					<Table.Tbody>
						{Object.keys(selectedItemData).map((key) => 
							<Table.Tr key={key}>
								<Table.Td>{key}</Table.Td>
								<Table.Td>{JSON.stringify(selectedItemData[key].value)}</Table.Td>
								<Table.Td align="center">
									<ActionIcon
										title="Toggle Layer"
										size={"sm"}
										onClick={() => {
											if(selectedValues.includes(key)) {
												removeAttribute(key);
											} else {
												setSelectedValues((prev) => [...prev, key]);
											}
										}}
										variant={selectedValues.includes(key) ? "filled" : "light"}
									>
										{selectedValues.includes(key) ? <Icon type={IconTypeEnum.Eye} /> : <Icon type={IconTypeEnum.EyeOff} />}
									</ActionIcon>
								</Table.Td>
							</Table.Tr>
						)}
					</Table.Tbody>

				</Table>
			</Stack>
		}
	</>;
}