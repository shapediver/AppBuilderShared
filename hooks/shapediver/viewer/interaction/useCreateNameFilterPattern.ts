import {useShapeDiverStoreSession} from "@AppBuilderShared/store/useShapeDiverStoreSession";
import {
	convertUserDefinedNameFilters,
	OutputNodeNameFilterPatterns,
} from "@shapediver/viewer.features.interaction";
import {ISessionApi} from "@shapediver/viewer.session";
import {useEffect, useState} from "react";

/**
 * Get the filter patterns for the given sessions and name filters.
 *
 * @param sessions
 * @param sessionIds
 * @param nameFilter
 * @returns
 */
const getPatterns = (
	sessions: {[key: string]: ISessionApi},
	nameFilter?: string[],
) => {
	if (!nameFilter) return {};

	const patterns: {[key: string]: OutputNodeNameFilterPatterns} = {};
	const currentSessionIds = Object.keys(sessions);

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
		if (Object.values(pattern).length > 0) patterns[sessionId] = pattern;
	});

	return patterns;
};

export type IUseCreateNameFilterPatternProps = {
	/**
	 * The user-defined name filters to convert.
	 */
	nameFilter?: string[];
};

export type IUseCreateNameFilterPatternResult = {
	[key: string]: OutputNodeNameFilterPatterns;
};

// #region Functions (1)

/**
 * Hook that converts user-defined name filters to filter patterns used by interaction hooks.
 * If you need this operation for multiple properties, use {@link useCreateNameFilterPatterns} instead.
 *
 * @param props The properties.
 */
export function useCreateNameFilterPattern(
	props: IUseCreateNameFilterPatternProps,
): {
	patterns: IUseCreateNameFilterPatternResult;
} {
	// get the session API
	const sessions = useShapeDiverStoreSession((state) => state.sessions);

	// create a state for the pattern(s)
	const [patterns, setPatterns] = useState<IUseCreateNameFilterPatternResult>(
		{},
	);

	useEffect(() => {
		const {nameFilter} = props;
		const pattern = getPatterns(sessions, nameFilter);
		setPatterns(pattern);
	}, [props, sessions]);

	return {patterns};
}

/**
 * Hook that converts user-defined name filters to filter patterns used by interaction hooks.
 * If you need this operation for a single property, use {@link useCreateNameFilterPattern} instead.
 *
 * @param props The properties.
 */
export function useCreateNameFilterPatterns(props: {
	[key: string]: IUseCreateNameFilterPatternProps;
}): {
	patterns: {
		[key: string]: IUseCreateNameFilterPatternResult;
	};
} {
	// get the session API
	const sessions = useShapeDiverStoreSession((state) => state.sessions);

	// create a state for the pattern(s)
	const [patterns, setPatterns] = useState<{
		[key: string]: IUseCreateNameFilterPatternResult;
	}>({});

	useEffect(() => {
		const patternDictionary: {
			[key: string]: IUseCreateNameFilterPatternResult;
		} = {};
		Object.entries(props).forEach(([key, value]) => {
			const {nameFilter} = value;
			const pattern = getPatterns(sessions, nameFilter);
			patternDictionary[key] = pattern;
		});
		setPatterns(patternDictionary);
	}, [props, sessions]);

	return {patterns};
}

// #endregion Functions (1)
