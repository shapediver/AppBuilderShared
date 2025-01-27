import {useShapeDiverStoreSession} from "@AppBuilderShared/store/useShapeDiverStoreSession";
import {
	convertUserDefinedNameFilters,
	OutputNodeNameFilterPatterns,
} from "@shapediver/viewer.features.interaction";
import {useState, useEffect} from "react";

// #region Type aliases (2)

type ICreateNameFilterPatternHandlerState = {
	sessionIds?: string[];
	nameFilter?: string[];
	setData?: React.Dispatch<
		React.SetStateAction<ICreateNameFilterPatternState>
	>;
};
export type ICreateNameFilterPatternState = {
	/**
	 * The patterns for the given name filters.
	 */
	patterns: {[key: string]: OutputNodeNameFilterPatterns};
};

// #endregion Type aliases (2)

// #region Functions (1)

/**
 * Hook that converts user-defined name filters to filter patterns used by interaction hooks.
 *
 * @param sessionIds The IDs of the sessions to create the filter pattern for.
 * 					If not provided, the filter pattern will be created for all sessions.
 * @param nameFilter The user-defined name filters to convert.
 */
export function useCreateNameFilterPattern(
	sessionIds?: string[],
	nameFilter?: string[],
): {
	patterns: {[key: string]: OutputNodeNameFilterPatterns};
} {
	// get the session API
	const sessions = useShapeDiverStoreSession((state) => {
		return state.sessions;
	});

	// create a state for the pattern
	const [patterns, setPatterns] = useState<{
		[key: string]: OutputNodeNameFilterPatterns;
	}>({});

	useEffect(() => {
		if (nameFilter !== undefined) {
			const patterns: {[key: string]: OutputNodeNameFilterPatterns} = {};
			const currentSessionIds = sessionIds || Object.keys(sessions);

			currentSessionIds.forEach((sessionId) => {
				const sessionApi = sessions[sessionId];
				const outputIdsToNamesMapping: {[key: string]: string} = {};
				Object.entries(sessionApi.outputs).forEach(
					([outputId, output]) =>
						(outputIdsToNamesMapping[outputId] = output.name),
				);
				const pattern = convertUserDefinedNameFilters(
					nameFilter,
					outputIdsToNamesMapping,
				);
				if (Object.values(pattern).length > 0)
					patterns[sessionId] = pattern;
			});
			setPatterns(patterns);
		}
	}, [nameFilter, sessions]);

	return {
		patterns,
	};
}

// #endregion Functions (1)

// #region Variables (1)

export const CreateNameFilterPatternHandler: React.FC<
	ICreateNameFilterPatternHandlerState
> = ({
	sessionIds,
	nameFilter,
	setData,
}: ICreateNameFilterPatternHandlerState) => {
	const {patterns} = useCreateNameFilterPattern(sessionIds, nameFilter);
	useEffect(() => {
		if (setData) {
			setData({patterns});
		}
	}, [patterns, setData]);

	return null;
};

// #endregion Variables (1)
