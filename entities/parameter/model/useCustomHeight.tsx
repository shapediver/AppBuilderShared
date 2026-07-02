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
 * @param scrollRootRef
 * @returns Object containing containerStyle, shouldUseScrollableContainer flag, and Wrapper component
 */
export function useCustomHeight(
	children?: React.ReactNode,
	height?: string | number | undefined,
	scrollRootRef?: React.Ref<HTMLDivElement>,
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

	// Do not memoize the scroll wrapper with `children` — remounting breaks
	// IntersectionObserver on the infinite-scroll sentinel inside this div.
	const element = height ? (
		<div
			ref={scrollRootRef}
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

	return {
		containerStyle,
		element,
	};
}
