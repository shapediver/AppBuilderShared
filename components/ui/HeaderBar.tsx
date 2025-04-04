import Icon from "@AppBuilderShared/components/ui/Icon";
import {IconTypeEnum} from "@AppBuilderShared/types/shapediver/icons";
import {
	ActionIcon,
	Image,
	useComputedColorScheme,
	useMantineColorScheme,
} from "@mantine/core";
import React from "react";
import {useLinkClickHandler} from "react-router-dom";
import classes from "./HeaderBar.module.css";

/**
 * Functional component that creates an image and a icon for the header bar.
 * The image redirect to the home page.
 * The icon changes the color theme.
 *
 * @returns
 */
export default function HeaderBar() {
	// -> colorScheme is 'auto' | 'light' | 'dark'
	const {colorScheme, setColorScheme} = useMantineColorScheme();

	// -> computedColorScheme is 'light' | 'dark', argument is the default value
	const computedColorScheme = useComputedColorScheme("light");

	// Correct color scheme toggle implementation
	// computedColorScheme is always either 'light' or 'dark'
	const toggleColorScheme = () => {
		setColorScheme(computedColorScheme === "dark" ? "light" : "dark");
	};

	const goToHome = useLinkClickHandler<HTMLImageElement>("/");

	return (
		<>
			<Image
				hiddenFrom="sm"
				className={classes.image}
				style={{
					width: "165px",
					filter: colorScheme === "dark" ? "" : "invert(1)",
				}}
				fit="contain"
				radius="md"
				src="https://shapediver.com/app/imgs/sd-logo-white-600x84.webp"
				alt="ShapeDiver Logo"
				onClick={(e) => goToHome(e)}
			/>
			<Image
				visibleFrom="sm"
				className={classes.image}
				style={{
					width: "250px",
					filter: colorScheme === "dark" ? "" : "invert(1)",
				}}
				fit="contain"
				radius="md"
				src="https://shapediver.com/app/imgs/sd-logo-white-600x84.webp"
				alt="ShapeDiver Logo"
				onClick={(e) => goToHome(e)}
			/>
			<ActionIcon
				variant="outline"
				color={colorScheme === "dark" ? "yellow" : "blue"}
				onClick={() => toggleColorScheme()}
				title="Toggle color scheme"
			>
				{colorScheme === "dark" ? (
					<Icon type={IconTypeEnum.Sun} />
				) : (
					<Icon type={IconTypeEnum.MoonStars} />
				)}
			</ActionIcon>
		</>
	);
}
