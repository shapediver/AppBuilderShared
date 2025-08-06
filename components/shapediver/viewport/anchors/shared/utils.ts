/**
 * Cleans the input value by converting it to a string with "px" appended if it's a number.
 * @param value The input value to clean.
 * @returns The cleaned string value.
 */
export const cleanUnit = (
	value: string | number | undefined,
): string | undefined => {
	return typeof value === "number" ? `${value}px` : value;
};

/**
 * Updates the position of the portal element based on the provided x and y coordinates.
 * @param x The x coordinate to set.
 * @param y The y coordinate to set.
 * @param portalRef The reference to the portal HTML element.
 * @param position A mutable ref object containing the current position.
 */
export const updatePosition = (
	x: string,
	y: string,
	portalRef: React.RefObject<HTMLDivElement>,
	position: React.MutableRefObject<{x: string; y: string}>,
) => {
	if (!portalRef.current) return;
	position.current.x = x;
	position.current.y = y;
	portalRef.current.style.left = x;
	portalRef.current.style.top = y;
};
