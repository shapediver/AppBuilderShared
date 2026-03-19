import {useMemo} from "react";

type HeightContainerStyle = {
	maxHeight?: string;
	overflowY?: string;
};

type UseCustomHeightResult = {
	containerStyle: HeightContainerStyle;
	element: React.ReactNode;
};

/**
 * Wraps content with height-related container styles when an explicit height is provided.
 * Keeps the content unchanged when height is not set.
 */
export function useCustomHeight(
	element: React.ReactNode,
	height?: string,
): UseCustomHeightResult {
	return useMemo(() => {
		if (!height) {
			return {
				containerStyle: {},
				element,
			};
		}

		return {
			containerStyle: {
				maxHeight: height,
				overflowY: "auto",
			},
			element,
		};
	}, [element, height]);
}

export default useCustomHeight;
