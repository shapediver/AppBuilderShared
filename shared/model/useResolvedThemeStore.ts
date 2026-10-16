import type {MantineThemeOverride} from "@mantine/core";
import {create} from "zustand";

interface IResolvedThemeStore {
	/** JSON theme last produced by `useCustomTheme`. `{}` until that hook runs. */
	theme: MantineThemeOverride;
	setTheme: (theme: MantineThemeOverride) => void;
}

/**
 * Complete theme from `useCustomTheme` (defaults, global overrides, and the
 * theme file). Tools API `getTheme` reads this so the agent window does not
 * rebuild the theme locally.
 *
 * Functions cannot cross the window, so only the JSON form is stored.
 */
export const useResolvedThemeStore = create<IResolvedThemeStore>((set) => ({
	theme: {},
	setTheme: (theme) => {
		set({theme});
	},
}));

let publishedSerialized = "";

/** Store the JSON form of the theme `useCustomTheme` just built. */
export function publishResolvedTheme(theme: MantineThemeOverride): void {
	let serialized: string;
	try {
		serialized = JSON.stringify(theme);
	} catch {
		return;
	}
	if (serialized === publishedSerialized) {
		return;
	}
	publishedSerialized = serialized;
	useResolvedThemeStore
		.getState()
		.setTheme(JSON.parse(serialized) as MantineThemeOverride);
}
