import {SdPlatformFilterValue} from "@shapediver/sdk.platform-api-sdk-v1";

/**
 * Define a filter condition for ShapeDiver Platform queries.
 *
 * @param expression The filter expression, e.g., "name[=]".
 * @param value The value to query for. If true, use the fallback value.
 * @param fallback
 * @returns
 */
export function defineFilter(
	expression: string,
	value: SdPlatformFilterValue | undefined,
	fallback: SdPlatformFilterValue,
): Record<string, SdPlatformFilterValue> {
	if (value === undefined) return {};
	return {
		[expression]: value === true ? fallback : value,
	};
}
