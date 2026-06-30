import type {CSSVariablesResolver} from "@mantine/core";

export function mergeCssVariablesResolvers(
	...resolvers: CSSVariablesResolver[]
): CSSVariablesResolver {
	return (theme) =>
		resolvers.reduce(
			(acc, resolve) => {
				const next = resolve(theme);
				return {
					variables: {...acc.variables, ...next.variables},
					light: {...acc.light, ...next.light},
					dark: {...acc.dark, ...next.dark},
				};
			},
			{variables: {}, light: {}, dark: {}},
		);
}
