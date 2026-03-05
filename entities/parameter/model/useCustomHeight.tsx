import React, {useMemo} from "react";

interface UseCustomHeightReturn {
	containerStyle: React.CSSProperties;
	element: React.ReactNode;
}

/**
 * Custom hook to handle height-related styling and logic for components
 * that need to support fixed height with scrollable content.
 *
 * @param children
 * @param height - Optional height value (string or number)
 * @returns Object containing containerStyle, shouldUseScrollableContainer flag, and Wrapper component
 */
export function useCustomHeight(
	children?: React.ReactNode,
	height?: string | number | undefined,
): UseCustomHeightReturn {
	const containerStyle = useMemo(() => {
		return height
			? {
					height,
					display: "flex",
					flexDirection: "column" as const,
				}
			: {};
	}, [height]);

	const element = useMemo(() => {
		return height ? (
			<div
				style={{
					flex: 1,
					overflowY: "auto",
					display: "flex",
					flexDirection: "column",
					gap: "var(--mantine-spacing-xs)",
				}}
			>
				{children}
			</div>
		) : (
			<>{children}</>
		);
	}, [children, height]);

	return {
		containerStyle,
		element,
	};
}
