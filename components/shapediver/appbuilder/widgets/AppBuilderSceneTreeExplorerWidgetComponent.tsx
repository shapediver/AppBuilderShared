import Icon from "@AppBuilderShared/components/ui/Icon";
import {useShapeDiverStoreInstances} from "@AppBuilderShared/store/useShapeDiverStoreInstances";
import {useShapeDiverStoreSession} from "@AppBuilderShared/store/useShapeDiverStoreSession";
import {IAppBuilderWidgetPropsSceneTreeExplorer} from "@AppBuilderShared/types/shapediver/appbuilder";
import {
	ActionIcon,
	ActionIconProps,
	Button,
	ButtonProps,
	Checkbox,
	Flex,
	Group,
	MantineThemeComponent,
	Paper,
	PaperProps,
	RenderTreeNodePayload,
	Title,
	TitleProps,
	Tree,
	TreeNodeData,
	TreeProps,
	useProps,
	useTree,
} from "@mantine/core";
import {
	getNodeName,
	isOnBlacklist,
} from "@shapediver/viewer.features.interaction";
import {ITreeNode} from "@shapediver/viewer.session";
import React, {useCallback, useEffect, useMemo, useState} from "react";

type StyleProps = {
	paperProps?: Partial<PaperProps>;
	titleProps?: Partial<TitleProps>;
	treeProps?: Partial<TreeProps>;
	buttonProps?: Partial<ButtonProps>;
	actionIconProps?: Partial<ActionIconProps>;
};

/**
 * Default style properties for the SceneTreeExplorer widget.
 */
const defaultStyleProps: Partial<StyleProps> = {
	paperProps: {
		style: {
			gap: 16,
			display: "flex",
			flexDirection: "column",
			maxHeight: "50vh", // 50% of viewport height
			overflowY: "auto",
		},
	},
	treeProps: {
		p: "xs",
		style: {
			backgroundColor: "var(--mantine-color-default)",
			borderRadius: "var(--mantine-radius-default)",
			overflowY: "auto",
		},
	},
	buttonProps: {
		variant: "light",
	},
	actionIconProps: {
		variant: "subtle",
	},
};

type AppBuilderSceneTreeExplorerWidgetThemePropsType = Partial<StyleProps>;

export function AppBuilderSceneTreeExplorerWidgetThemeProps(
	props: AppBuilderSceneTreeExplorerWidgetThemePropsType,
): MantineThemeComponent {
	return {
		defaultProps: props,
	};
}

export default function AppBuilderSceneTreeExplorerWidgetComponent(
	props: IAppBuilderWidgetPropsSceneTreeExplorer &
		AppBuilderSceneTreeExplorerWidgetThemePropsType,
) {
	const {...rest} = props;

	const {paperProps, titleProps, treeProps, buttonProps, actionIconProps} =
		useProps("AppBuilderSceneTreeExplorerWidget", defaultStyleProps, rest);

	const [data, setData] = useState<{
		[key: string]: TreeNodeData[];
	}>({});
	const [onlyShowNodesWithName, setOnlyShowNodesWithName] =
		useState<boolean>(true);

	const {addSessionUpdateCallback, sessions} = useShapeDiverStoreSession(
		(state) => ({
			addSessionUpdateCallback: state.addSessionUpdateCallback,
			sessions: state.sessions,
		}),
	);
	const instances = useShapeDiverStoreInstances((state) => state.instances);

	const tree = useTree();

	/**
	 * Callback to handle the session and instance data updates.
	 * It updates the sessionData and instanceData state with the new data.
	 * @param id The ID of the session or instance.
	 * @param set The setter function to update the state.
	 * @param newNode The new node to update the state with.
	 */
	const callback = useCallback(
		(id: string, newNode?: ITreeNode) => {
			if (!newNode) {
				// If newNode is undefined, remove the data for the given ID
				setData((prevData) => {
					const newData = {...prevData};
					delete newData[id];
					return newData;
				});
				return;
			}

			// Map data to tree node format
			const data = getNodeData(newNode, onlyShowNodesWithName);

			if (
				!Array.isArray(data) &&
				data.children &&
				data.children.length === 0
			) {
				// If data is not an array and has no children, return early
				return;
			}

			// Set the data for the tree
			setData((prevData) => {
				return {
					...prevData,
					[id]: Array.isArray(data) ? data : [data],
				};
			});
		},
		[onlyShowNodesWithName],
	);

	/**
	 * Use effect to add / remove the session update callbacks.
	 * This will add the session data to the tree.
	 *
	 * The dependencies include sessions, instances, and the callback function.
	 * The instances dependency is necessary to ensure that the component re-renders
	 * when instances are added to the session node.
	 */
	useEffect(() => {
		const removeSessionUpdateCallbacks = Object.keys(sessions).map(
			(sessionId) =>
				addSessionUpdateCallback(
					sessionId,
					(newNode?: ITreeNode, oldNode?: ITreeNode) => {
						callback(sessionId, newNode);
					},
				),
		);
		return () => {
			removeSessionUpdateCallbacks.forEach(
				(removeSessionUpdateCallback) => {
					removeSessionUpdateCallback();
				},
			);
			// Clear session data when sessions change
			setData({});
		};
	}, [sessions, instances, callback]);

	/**
	 * Render function for the tree nodes.
	 * It renders the node label, an icon for visibility toggle, and handles the expansion of nodes.
	 * @param node The node to render.
	 * @param expanded Whether the node is expanded.
	 * @param hasChildren Whether the node has children.
	 * @param elementProps The properties for the element.
	 * @param tree The tree instance.
	 * @returns The rendered tree node.
	 */
	const renderTreeNode = ({
		node,
		expanded,
		hasChildren,
		elementProps,
		tree,
	}: RenderTreeNodePayload) => {
		return (
			<Group {...elementProps}>
				{hasChildren && (
					<Icon
						iconType={"tabler:chevron-down"}
						size={14}
						style={{
							transform: expanded
								? "rotate(180deg)"
								: "rotate(0deg)",
						}}
					/>
				)}
				<span>{node.label}</span>
				<Flex style={{flex: 1}} />
				<Group onClick={() => tree.toggleExpanded(node.value)}>
					<ActionIcon
						{...actionIconProps}
						onClick={() => {
							if (!node?.nodeProps?.node) return;
							node.nodeProps.node.visible =
								!node.nodeProps.node.visible;
							node.nodeProps.node.updateVersion();
						}}
					>
						<Icon
							iconType={
								node.nodeProps?.node.visible
									? "tabler:eye"
									: "tabler:eye-off"
							}
						/>
					</ActionIcon>
				</Group>
			</Group>
		);
	};

	const flatData = useMemo(() => {
		return Object.values(data).flat();
	}, [data]);

	return (
		<Paper {...paperProps}>
			<Title {...titleProps}>Scene Tree Explorer</Title>
			<Tree
				data={flatData}
				tree={tree}
				renderNode={renderTreeNode}
				{...treeProps}
			/>
			<Group justify="flex-end">
				<Checkbox
					checked={onlyShowNodesWithName}
					onChange={(event) =>
						setOnlyShowNodesWithName(event.currentTarget.checked)
					}
					label="Only show nodes with a name"
				/>
				<Flex style={{flex: 1}} />
				<Button {...buttonProps} onClick={() => tree.expandAllNodes()}>
					Expand all
				</Button>
				<Button
					{...buttonProps}
					onClick={() => tree.collapseAllNodes()}
				>
					Collapse all
				</Button>
			</Group>
		</Paper>
	);
}

/**
 * Function to get the node data recursively.
 * It traverses the tree and collects the data for each node.
 *
 * Depending on the `onlyShowNodesWithName` state, it either returns all nodes or only those with a clearly specified name.
 *
 * @param node The current node to process.
 * @returns The data for the current node and its children.
 */
const getNodeData = (
	node: ITreeNode,
	strictMode: boolean,
): TreeNodeData | TreeNodeData[] => {
	const childrenData = [];

	// Return all children data recursively
	for (let i = 0; i < node.children.length; i++) {
		const childNode = node.children[i];
		const childData = getNodeData(childNode, strictMode);
		if (Array.isArray(childData)) {
			childrenData.push(...childData);
		} else {
			childrenData.push(childData);
		}
	}

	const nodeName = getNodeName(node, strictMode);

	// If onlyShowNodesWithName is true, we filter out nodes without a name
	// And check if the node name is on the blacklist (names that are used by ShapeDiver, but not by the user)
	if (!nodeName || (strictMode && isOnBlacklist(nodeName))) {
		return childrenData;
	} else {
		return {
			label: getNodeName(node, strictMode) || node.name,
			value: node.id,
			children: childrenData,
			nodeProps: {
				node: node,
			},
		};
	}
};
