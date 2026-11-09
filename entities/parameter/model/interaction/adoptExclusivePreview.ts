type PreviewCandidate = {name: string; node: {id: string}};

/**
 * Hand a hover preview to the selection.
 *
 * `promote` reports a matrix before it returns. The name map has to name
 * the preview's node first. Otherwise that report is a single unknown node
 * and is stored under the node that is still selected, replacing the
 * transformation of the previous object. The previous gizmo is closed
 * before `promote` so the two gizmos never share an id.
 */
export function adoptExclusivePreview(input: {
	nodeNamesRef: {current: Map<string, string>};
	selectionGizmo: {close: () => void} | undefined;
	preview: {promote: (id: string) => void; candidate: PreviewCandidate};
	componentId: string;
	setSelected: (names: string[]) => void;
	clearSelectionGizmo: () => void;
}): void {
	const {candidate} = input.preview;
	input.nodeNamesRef.current = new Map([[candidate.node.id, candidate.name]]);
	input.selectionGizmo?.close();
	input.clearSelectionGizmo();
	input.preview.promote(input.componentId);
	input.setSelected([candidate.name]);
}
