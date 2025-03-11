import {useShapeDiverStoreSession} from "@AppBuilderShared/store/useShapeDiverStoreSession";
import {
	convertUserDefinedNameFilters,
	OutputNodeNameFilterPatterns,
} from "@shapediver/viewer.features.interaction";
import {IDraggingParameterProps} from "@shapediver/viewer.session";
import {vec3} from "gl-matrix";
import {useEffect, useState} from "react";

// #region Type aliases (1)

/**
 * The converted dragging object used by interaction hooks.
 * This includes the conversion of name filters to filter patterns.
 */
export type ConvertedDragObject = {
	patterns: {[key: string]: OutputNodeNameFilterPatterns};
	restrictions: string[];
	dragOrigin?: vec3;
	dragAnchors?: {
		id: string;
		position: vec3;
		rotation?: {
			angle: number;
			axis: vec3;
		};
	}[];
};

// #endregion Type aliases (1)

// #region Functions (1)

/**
 * Hook that converts user-defined dragging properties to converted dragging objects used by interaction hooks.
 * This includes the conversion of name filters to filter patterns.
 *
 * @param sessionIds The IDs of the sessions to create the filter pattern for.
 * 					If not provided, the filter pattern will be created for all sessions.
 * @param draggingProps The dragging properties to convert.
 */
export function useConvertDraggingData(
	sessionIds?: string[],
	draggingProps?: IDraggingParameterProps,
): {
	objects: ConvertedDragObject[];
} {
	// get the session API
	const sessions = useShapeDiverStoreSession((state) => {
		return state.sessions;
	});

	// create a state for the pattern
	const [objects, setObjects] = useState<ConvertedDragObject[]>([]);

	useEffect(() => {
		const newObjects: ConvertedDragObject[] = [];

		for (const object of draggingProps?.objects ?? []) {
			const nameFilter = object.nameFilter;

			const patterns: {[key: string]: OutputNodeNameFilterPatterns} = {};
			const currentSessionIds = sessionIds || Object.keys(sessions);

			// create the pattern for each session
			currentSessionIds.forEach((sessionId) => {
				const sessionApi = sessions[sessionId];
				const outputIdsToNamesMapping: {[key: string]: string} = {};
				Object.entries(sessionApi.outputs).forEach(
					([outputId, output]) =>
						(outputIdsToNamesMapping[outputId] = output.name),
				);
				const pattern = convertUserDefinedNameFilters(
					[nameFilter],
					outputIdsToNamesMapping,
				);
				if (Object.values(pattern).length > 0)
					patterns[sessionId] = pattern;
			});

			// create the new object
			newObjects.push({
				patterns: patterns,
				restrictions: object.restrictions ?? [],
				dragOrigin: object.dragOrigin
					? vec3.fromValues(
							object.dragOrigin[0],
							object.dragOrigin[1],
							object.dragOrigin[2],
						)
					: undefined,
				dragAnchors: object.dragAnchors
					? object.dragAnchors.map((anchor) => {
							return {
								id: anchor.id,
								position: vec3.fromValues(
									anchor.position[0],
									anchor.position[1],
									anchor.position[2],
								),
								rotation: anchor.rotation
									? {
											angle: anchor.rotation.angle,
											axis: anchor.rotation.axis
												? vec3.fromValues(
														anchor.rotation.axis[0],
														anchor.rotation.axis[1],
														anchor.rotation.axis[2],
													)
												: vec3.fromValues(0, 0, 1),
										}
									: undefined,
							};
						})
					: undefined,
			});
		}
		setObjects(newObjects);
	}, [draggingProps, sessions]);

	return {
		objects,
	};
}

// #endregion Functions (1)
