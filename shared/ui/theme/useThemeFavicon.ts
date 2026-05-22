import {MantineThemeOverride} from "@mantine/core";
import {useColorScheme, useFavicon} from "@mantine/hooks";

type ThemeFaviconOther = {
	iconUrl?: string;
	iconDarkUrl?: string;
	iconLightUrl?: string;
};

function getFaviconOther(theme: MantineThemeOverride): ThemeFaviconOther {
	return (theme.other ?? {}) as ThemeFaviconOther;
}

export function useThemeFavicon(theme: MantineThemeOverride) {
	const systemColorScheme = useColorScheme();
	const {iconUrl, iconDarkUrl, iconLightUrl} = getFaviconOther(theme);
	const faviconUrl =
		iconDarkUrl && iconLightUrl
			? systemColorScheme === "dark"
				? iconDarkUrl
				: iconLightUrl
			: iconUrl;

	useFavicon(faviconUrl ?? "");
}
