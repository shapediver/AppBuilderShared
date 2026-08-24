import {useEffect, useRef} from "react";

interface UseSuspendedSelectionRestoreOptions {
	suspended: boolean;
	selectedNodeNames: string[];
	setSelectedNodeNames: (names: string[]) => void;
	requestSelectionRestore: () => void;
}

/** Preserves selection while a persistent selection is suspended. */
export const useSuspendedSelectionRestore = ({
	suspended,
	selectedNodeNames,
	setSelectedNodeNames,
	requestSelectionRestore,
}: UseSuspendedSelectionRestoreOptions) => {
	const suspendedSelectionRef = useRef(selectedNodeNames);
	const wasSuspendedRef = useRef(suspended);

	useEffect(() => {
		if (!suspended) suspendedSelectionRef.current = selectedNodeNames;
	}, [selectedNodeNames, suspended]);

	useEffect(() => {
		const wasSuspended = wasSuspendedRef.current;
		wasSuspendedRef.current = suspended;
		if (wasSuspended && !suspended) {
			setSelectedNodeNames(suspendedSelectionRef.current);
			requestSelectionRestore();
		}
	}, [requestSelectionRestore, setSelectedNodeNames, suspended]);
};
