import Icon from "@AppBuilderShared/components/ui/Icon";
import {useSelection} from "@AppBuilderShared/hooks/shapediver/viewer/interaction/selection/useSelection";
import {useShapeDiverStoreSession} from "@AppBuilderShared/store/useShapeDiverStoreSession";
import {IconTypeEnum} from "@AppBuilderShared/types/shapediver/icons";
import {ActionIcon, Group, Stack, Table, Title} from "@mantine/core";
import {getNodesByName} from "@shapediver/viewer.features.interaction";
import {
	ISDTFAttributeData,
	ITreeNode,
	SDTFItemData,
	SessionApiData,
} from "@shapediver/viewer.session";
import {IconChevronDown, IconChevronUp} from "@tabler/icons-react";
import React, {useCallback, useEffect, useMemo, useState} from "react";

interface SelectedAttributeProps {
	viewportId: string;
	active: boolean;
	selectedValues: {name: string; type: string}[];
	setSelectedValues: React.Dispatch<
		React.SetStateAction<{name: string; type: string}[]>
	>;
	removeAttribute: (key: string, type: string) => void;
}

/**
 * Component to be able to select an attribute from the viewer and show its values.
 *
 * @param props
 * @returns
 */
export default function SelectedAttribute(props: SelectedAttributeProps) {
	const {
		viewportId,
		active,
		selectedValues,
		setSelectedValues,
		removeAttribute,
	} = props;
	const sessions = useShapeDiverStoreSession((state) => state.sessions);

	const [nameFilter, setNameFilter] = useState<{[key: string]: string[]}>({});
	const [selectedItemData, setSelectedItemData] = useState<{
		[key: string]: ISDTFAttributeData;
	}>();
	const [opened, setOpened] = useState(true);
	const {addSessionUpdateCallback} = useShapeDiverStoreSession();

	/**
	 * Whenever the session is updated, the name filter is updated as well.
	 * We search for all nodes that have an SDTFItemData and add the name of the node to the name filter.
	 */
	const sessionCallback = useCallback(
		(newNode?: ITreeNode) => {
			if (!newNode) return;

			const sessionApi = (
				newNode.data.find(
					(data) => data instanceof SessionApiData,
				) as SessionApiData
			).api;
			if (!sessionApi) return;

			const nameFilterPerSession: string[] = [];
			newNode.traverse((node) => {
				for (const data of node.data) {
					if (data instanceof SDTFItemData) {
						// get the name of the node and add it to the name filter
						const path = node.getPath().split(".");
						// remove the first two elements of the path, because they are the root and session name
						// we might get here before the session is even added to the root, so we check for that
						if (path[0] === "root") path.shift();
						path.shift();
						// replace the first element of the path with the output name
						const outputApi = sessionApi.outputs[path[0]];
						if (!outputApi) continue;
						path[0] = outputApi.name;
						nameFilterPerSession.push(path.join("."));
					}
				}
			});

			setNameFilter((prev) => {
				const newFilter = {...prev};
				newFilter[sessionApi.id] = nameFilterPerSession;

				return newFilter;
			});
		},
		[sessions],
	);

	useEffect(() => {
		const removeSessionUpdateCallbacks = Object.keys(sessions).map(
			(sessionId) => addSessionUpdateCallback(sessionId, sessionCallback),
		);

		return () => {
			removeSessionUpdateCallbacks.forEach(
				(removeSessionUpdateCallback) => {
					removeSessionUpdateCallback();
				},
			);
		};
	}, [sessions, sessionCallback]);

	const selectionProps = useMemo(() => {
		return {
			maximumSelection: 1,
			minimumSelection: 1,
			nameFilter: Object.values(nameFilter).flat(),
			selectionColor: "#0d44f0",
			hover: true,
			hoverColor: "#00ff78",
		};
	}, [nameFilter]);

	const {selectedNodeNames} = useSelection(
		viewportId,
		selectionProps,
		active,
		undefined,
		false,
	);

	useEffect(() => {
		if (selectedNodeNames.length > 0) {
			const nodes = getNodesByName(
				Object.values(sessions),
				selectedNodeNames,
				false,
			);
			if (nodes.length > 0) {
				const node = nodes[0].node;
				const sdtfItemData = node.data.find(
					(data) => data instanceof SDTFItemData,
				);
				if (sdtfItemData) {
					setSelectedItemData(sdtfItemData.attributes);

					return;
				}
			}
		}

		setSelectedItemData(undefined);
	}, [selectedNodeNames]);

	return (
		<>
			{selectedItemData && (
				<Stack>
					<Group
						justify="space-between"
						onClick={() => setOpened((t) => !t)}
					>
						<Title order={5}> Selected Item </Title>
						{opened ? <IconChevronUp /> : <IconChevronDown />}
					</Group>
					{opened && (
						<Table highlightOnHover withTableBorder>
							<Table.Thead>
								<Table.Tr bg={"var(--table-hover-color)"}>
									<Table.Th
										style={{
											width: "20%",
											whiteSpace: "nowrap",
										}}
									>
										Name
									</Table.Th>
									<Table.Th style={{width: "100%"}}>
										Value
									</Table.Th>
									<Table.Th
										style={{
											width: "auto",
											whiteSpace: "nowrap",
										}}
									>
										Show
									</Table.Th>
								</Table.Tr>
							</Table.Thead>
							<Table.Tbody>
								{Object.entries(selectedItemData).map(
									([key, value]) => (
										<Table.Tr
											key={key}
											bg={
												selectedValues.find(
													(s) =>
														s.name === key &&
														s.type ===
															value.typeHint,
												)
													? "var(--mantine-primary-color-light)"
													: undefined
											}
										>
											<Table.Td>{key}</Table.Td>
											<Table.Td>
												{JSON.stringify(
													selectedItemData[key].value,
												)}
											</Table.Td>
											<Table.Td align="center">
												<ActionIcon
													title="Toggle Layer"
													size={"sm"}
													onClick={() => {
														if (
															selectedValues.find(
																(s) =>
																	s.name ===
																		key &&
																	s.type ===
																		value.typeHint,
															)
														) {
															removeAttribute(
																key,
																value.typeHint,
															);
														} else {
															setSelectedValues(
																(prev) => [
																	...prev,
																	{
																		name: key,
																		type: value.typeHint,
																	},
																],
															);
														}
													}}
													variant={
														selectedValues.find(
															(s) =>
																s.name ===
																	key &&
																s.type ===
																	value.typeHint,
														)
															? "filled"
															: "light"
													}
												>
													{selectedValues.find(
														(s) =>
															s.name === key &&
															s.type ===
																value.typeHint,
													) ? (
														<Icon
															type={
																IconTypeEnum.EyeOff
															}
														/>
													) : (
														<Icon
															type={
																IconTypeEnum.Eye
															}
														/>
													)}
												</ActionIcon>
											</Table.Td>
										</Table.Tr>
									),
								)}
							</Table.Tbody>
						</Table>
					)}
				</Stack>
			)}
		</>
	);
}
