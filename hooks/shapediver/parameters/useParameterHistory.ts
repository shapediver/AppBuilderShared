import {useShapeDiverStoreParameters} from "@AppBuilderShared/store/useShapeDiverStoreParameters";
import {IHistoryEntry} from "@AppBuilderShared/types/store/shapediverStoreParameters";
import {useEffect} from "react";
import {useShallow} from "zustand/react/shallow";

interface Props {
	loaded: boolean;
}

/**
 * Hook providing parameter history.
 */
export function useParameterHistory(props: Props) {
	const {loaded} = props;

	const {
		getDefaultState,
		pushHistoryState,
		resetHistory,
		restoreHistoryStateFromEntry,
	} = useShapeDiverStoreParameters(
		useShallow((state) => ({
			getDefaultState: state.getDefaultState,
			pushHistoryState: state.pushHistoryState,
			resetHistory: state.resetHistory,
			restoreHistoryStateFromEntry: state.restoreHistoryStateFromEntry,
		})),
	);

	useEffect(() => {
		const handlePopState = async (event: any) => {
			if (!event.state) return;
			const entry = event.state as IHistoryEntry;
			await restoreHistoryStateFromEntry(entry);
		};

		window.addEventListener("popstate", handlePopState);

		return () => {
			window.removeEventListener("popstate", handlePopState);
		};
	}, [restoreHistoryStateFromEntry]);

	useEffect(() => {
		if (!loaded) return;

		const defaultState = getDefaultState();
		const entry = pushHistoryState(defaultState);
		history.replaceState(entry, "", "");

		return () => {
			resetHistory();
		};
	}, [loaded, getDefaultState, pushHistoryState, resetHistory]);

	return;
}
