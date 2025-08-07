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

/**
 * Represents a parsed CSS unit value
 */
interface ParsedValue {
	value: number | string; // Can be a number or a string for functions or unknown values
	unit?: string; // Unit can be undefined for functions or unknown values
}

/**
 * Parses a CSS value string into numeric value and unit
 */
const parseValue = (str: string): ParsedValue => {
	const trimmed = str.trim();

	// Define common, supported units
	const commonUnits = ["px", "rem", "em", "%", "vh", "vw"];

	// Check each unit
	for (const unit of commonUnits) {
		if (trimmed.endsWith(unit)) {
			const num = parseFloat(trimmed.slice(0, -unit.length));
			return isNaN(num) ? {value: trimmed} : {value: num, unit};
		}
	}

	// Handle unitless numbers (treat as px)
	const num = parseFloat(trimmed);
	if (!isNaN(num)) {
		return {value: num, unit: "px"};
	}

	// If no unit matches, return as is
	return {value: trimmed};
};

/**
 * Simplifies nested calc() expressions by combining the same units and removing unnecessary nesting.
 * This prevents exceedingly long CSS calc() properties that can impact performance.
 *
 * Supports common CSS units:
 * - Length: px, rem, em, vh, vw
 * - Percentage: %
 *
 * Examples:
 * - "calc(calc(100px + 50px) + 25px)" becomes "175px"
 * - "calc(100px + 50%)" stays as "calc(100px + 50%)" (mixed units)
 * - "calc(200px - calc(50px + 25px))" becomes "125px"
 * - "calc(50vw + 25vw)" becomes "75vw"
 * - "calc(100px + 50px + var(--spacing))" becomes "calc(150px + var(--spacing))"
 * - "calc(50% + 25% + min(10px, 1rem))" becomes "calc(75% + min(10px, 1rem))"
 * - "calc(var(--a) + var(--b))" stays as "calc(var(--a) + var(--b))" (unchanged)
 *
 * @param exp The calc() expression to simplify
 * @returns A simplified CSS value string
 */
export const simplifyCalc = (exp: string): string => {
	// Base case: no calc() to process
	if (!exp.includes("calc(")) {
		return exp;
	}

	// Match only the innermost `calc(...)` expressions
	const calcRegex = /calc\(([^()]+)\)/g;

	// Recursively simplify nested calc() expressions
	// Start with the inner-most calc() and work outward
	let processed = exp;
	while (processed.includes("calc(")) {
		const newProcessed = processed.replace(calcRegex, (_, content) => {
			return evaluateSimpleCalc(content);
		});

		// Reset regex for next iteration
		// so that it always starts from the innermost calc()
		calcRegex.lastIndex = 0;

		// Prevent infinite loops
		// If no changes were made, break the loop
		if (newProcessed === processed) break;
		processed = newProcessed;
	}
	return processed;
};

/**
 * Evaluates a simple calc expression (no nested calc) and combines like units
 */
const evaluateSimpleCalc = (content: string): string => {
	// Split on + and - while keeping the operators
	const parts = content.split(/(\s*[+-]\s*)/).filter((s) => s.trim());

	// Track values by unit and unknown expressions
	const units: {
		[key: string]: number;
	} = {};
	const unknowns: string[] = [];

	// Store the sign before each part
	let sign = 1;

	for (const part of parts) {
		const trimmedPart = part.trim();
		if (trimmedPart === "+") {
			sign = 1;
		} else if (trimmedPart === "-") {
			sign = -1;
		} else {
			// try to find a matching unit
			const parsed = parseValue(trimmedPart);
			if (typeof parsed.value === "number" && parsed.unit) {
				// Can evaluate - add to units
				units[parsed.unit] =
					(units[parsed.unit] || 0) + parsed.value * sign;
			} else {
				// Cannot evaluate - keep as-is
				const prefix = sign === 1 ? " + " : " - ";
				unknowns.push(prefix + trimmedPart);
			}
		}
	}

	// Combine evaluated and unknown parts
	const allParts: string[] = [];

	// Add simplified units
	Object.entries(units).forEach(([unit, val]) => {
		allParts.push(
			val >= 0 ? ` + ${val}${unit}` : ` - ${Math.abs(val)}${unit}`,
		);
	});

	// Add unknown parts
	allParts.push(...unknowns);

	if (allParts.length === 0) return "0px";

	// Remove leading " + " or " - " from first part and handle the result
	let result = allParts.join("");
	if (result.startsWith(" + ")) {
		result = result.substring(3);
	} else if (result.startsWith(" - ")) {
		result = "-" + result.substring(3);
	}

	// If only one simplified part and no unknowns, return without calc()
	// Example: "calc(150px - 10px)" can be simplified to "140px"
	if (Object.keys(units).length === 1 && unknowns.length === 0) {
		const [unit, val] = Object.entries(units)[0];
		return `${val}${unit}`;
	}

	return `calc(${result})`;
};
