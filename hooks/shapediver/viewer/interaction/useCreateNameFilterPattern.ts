import { convertUserDefinedNameFilters, OutputNodeNameFilterPatterns } from "@shapediver/viewer.features.interaction";
import { useShapeDiverStoreViewer } from "../../../../store/useShapeDiverStoreViewer";
import { useState, useEffect } from "react";

// #region Functions (1)

/**
 * Hook that converts user-defined name filters to filter patterns used by interaction hooks. 
 * 
 * @param sessionIds The IDs of the sessions to create the filter pattern for. 
 * 					If not provided, the filter pattern will be created for all sessions.
 * @param nameFilter The user-defined name filters to convert.
 */
export function useCreateNameFilterPattern(sessionIds?: string[], nameFilter?: string[]): {
    patterns: OutputNodeNameFilterPatterns
} {
	// get the session API
	const sessions = useShapeDiverStoreViewer(state => { return state.sessions; });

	// create a state for the pattern
	const [patterns, setPatterns] = useState<OutputNodeNameFilterPatterns>({});

	useEffect(() => {
		if (nameFilter !== undefined) {
			const outputIdsToNamesMapping: { [key: string]: string } = {};
			if(sessionIds) {
				sessionIds.forEach(sessionId => {
					const sessionApi = sessions[sessionId];
					Object.entries(sessionApi.outputs).forEach(([outputId, output]) => outputIdsToNamesMapping[outputId] = output.name);
				});
			} else {
				Object.values(sessions).forEach(sessionApi => {
					Object.entries(sessionApi.outputs).forEach(([outputId, output]) => outputIdsToNamesMapping[outputId] = output.name);
				});
			}
			setPatterns(convertUserDefinedNameFilters(nameFilter, outputIdsToNamesMapping));
		}
	}, [nameFilter, sessions]);

	return {
		patterns
	};
}

// #endregion Functions (1)
