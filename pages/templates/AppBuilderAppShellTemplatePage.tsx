import {useIsLandscape} from "@AppBuilderShared/hooks/ui/useIsLandscape";
import {
	ResponsiveValueType,
	useResponsiveValueSelector,
} from "@AppBuilderShared/hooks/ui/useResponsiveValueSelector";
import AppBuilderContainerWrapper from "@AppBuilderShared/pages/templates/AppBuilderContainerWrapper";
import {IAppBuilderTemplatePageProps} from "@AppBuilderShared/types/pages/appbuildertemplates";
import {createGridLayout} from "@AppBuilderShared/utils/misc/layout";
import {
	AppShell,
	AppShellResponsiveSize,
	Burger,
	Group,
	MantineBreakpoint,
	MantineThemeComponent,
	useMantineTheme,
	useProps,
} from "@mantine/core";
import {AppShellSize} from "@mantine/core/lib/components/AppShell/AppShell.types";
import {useDisclosure, useMediaQuery} from "@mantine/hooks";
import React, {useEffect, useState} from "react";
import classes from "./AppBuilderAppShellTemplatePage.module.css";

interface StyleProps {
	/** Height of the header (responsive) */
	headerHeight: AppShellResponsiveSize | AppShellSize;
	/** Breakpoint below which to hide the navigation bar */
	navbarBreakpoint: MantineBreakpoint;
	/** Width of the navigation bar */
	navbarWidth: AppShellResponsiveSize | AppShellSize;
	/** Main area (viewport, bottom, and right container): Number of grid columns */
	columns: ResponsiveValueType<number>;
	/** Main area (viewport, bottom, and right container): Number of grid rows */
	rows: ResponsiveValueType<number>;
	/** Main area (viewport, bottom, and right container): Number of columns for right container */
	rightColumns: ResponsiveValueType<number>;
	/** Main area (viewport, bottom, and right container): Number of rows for bottom container */
	bottomRows: ResponsiveValueType<number>;
	/** Main area (viewport, bottom, and right container): Shall the bottom container use the full width? */
	bottomFullWidth: ResponsiveValueType<boolean>;
	/** Should the navbar have a border */
	navbarBorder: boolean;
	/** Should the header have a border */
	headerBorder: boolean;
	/** Should the right container area have a border */
	rightBorder: boolean;
	/**
	 * Should the bottom container be shown at the bottom of the grid even below the navbarBreakpoint?
	 * If false, the bottom container is shown as part of the navigation bar area below the navbarBreakpoint.
	 * In that case, the right container moves to the bottom of the grid layout in portrait mode.
	 */
	keepBottomInGrid: boolean;
}

const defaultStyleProps: StyleProps = {
	headerHeight: {base: "4em", md: "4em"},
	navbarBreakpoint: "md",
	navbarWidth: {md: 250, lg: 300},
	columns: 3,
	rows: 3,
	rightColumns: 1,
	bottomRows: 1,
	bottomFullWidth: false,
	navbarBorder: true,
	headerBorder: true,
	rightBorder: true,
	keepBottomInGrid: false,
};

type AppBuilderAppShellTemplatePageThemePropsType = Partial<StyleProps>;

export function AppBuilderAppShellTemplatePageThemeProps(
	props: AppBuilderAppShellTemplatePageThemePropsType,
): MantineThemeComponent {
	return {
		defaultProps: props,
	};
}

/**
 * AppShell layout template page for AppBuilder.
 * This template is partially based on Mantine's AppShell component.
 * Note that it does not make use of the aside feature of the AppShell component,
 * but rather uses a 3 by 3 grid layout to divide the main area between the
 * children (the viewport) and the right container if the device is in landscape mode.
 * In portrait mode the right container is shown below the main area, using a
 * height of 300px.
 * The bottom container is shown at the bottom of the grid layout if and only if
 * the device is in landscape mode and the width is above the navbar breakpoint.
 * Otherwise the bottom container is shown as part of the navigation bar area,
 * using vertical layout.
 * @see https://mantine.dev/core/app-shell/
 * @param
 * @returns
 */
export default function AppBuilderAppShellTemplatePage(
	props: IAppBuilderTemplatePageProps & Partial<StyleProps>,
) {
	const {
		top = undefined,
		bottom = undefined,
		left = undefined,
		children = undefined,
		right = undefined,
	} = props;

	// style properties
	const {
		headerHeight,
		navbarBreakpoint,
		navbarWidth,
		columns: _columns,
		rows: _rows,
		rightColumns: _rightColumns,
		bottomRows: _bottomRows,
		bottomFullWidth: _bottomFullWidth,
		navbarBorder,
		headerBorder,
		rightBorder,
		keepBottomInGrid,
	} = useProps("AppBuilderAppShellTemplatePage", defaultStyleProps, props);

	const [opened, {toggle}] = useDisclosure();
	const isLandscape = useIsLandscape();
	const theme = useMantineTheme();
	const aboveNavbarBreakpoint = useMediaQuery(
		`(min-width: ${theme.breakpoints[navbarBreakpoint]})`,
	);
	const showBottomInGrid =
		!!bottom && (aboveNavbarBreakpoint || keepBottomInGrid);
	const showRightAtBottom = !!right && !showBottomInGrid && !isLandscape;
	const showRightInNavbar = !!right && showBottomInGrid && !isLandscape;
	const hasNavbarContent =
		!!left || (!!bottom && !showBottomInGrid) || showRightInNavbar;
	const showHeader = !!top || (hasNavbarContent && !aboveNavbarBreakpoint);
	const hasRight = !!right && !showRightAtBottom && !showRightInNavbar;
	const hasBottom =
		(!!right && showRightAtBottom) || (!!bottom && showBottomInGrid);

	const columns = useResponsiveValueSelector(_columns);
	const rows = useResponsiveValueSelector(_rows);
	const rightColumns = useResponsiveValueSelector(_rightColumns);
	const bottomRows = useResponsiveValueSelector(_bottomRows);
	const bottomFullWidth = useResponsiveValueSelector(_bottomFullWidth);

	const [rootStyle, setRootStyle] = useState<React.CSSProperties>({
		...createGridLayout({
			hasRight,
			hasBottom,
			rows,
			columns,
			rightColumns,
			bottomRows,
			bottomFullWidth,
		}),
	});

	useEffect(() => {
		setRootStyle({
			...rootStyle,
			...createGridLayout({
				hasRight,
				hasBottom,
				rows,
				columns,
				rightColumns,
				bottomRows,
				bottomFullWidth,
			}),
		});
	}, [
		hasRight,
		hasBottom,
		columns,
		rows,
		rightColumns,
		bottomRows,
		bottomFullWidth,
	]);

	return (
		<>
			<AppShell
				padding="0"
				// We hide the header in case there is no top and no left container content.
				// In case there left container content, we only show the header below the navbar breakpoint
				// (see hiddenFrom prop of AppShell.Header).
				header={{height: headerHeight, collapsed: !showHeader}}
				navbar={{
					breakpoint: navbarBreakpoint,
					width: navbarWidth,
					collapsed: {
						mobile: !opened || !hasNavbarContent,
						desktop: !hasNavbarContent,
					},
				}}
				// We need to define the background color here, because the corresponding element
				// is used for fullscreen mode and would otherwise be transparent (show as black).
				style={{backgroundColor: "var(--mantine-color-body)"}}
			>
				<AppShell.Header withBorder={headerBorder}>
					<Group
						h="100%"
						justify="space-between"
						wrap="nowrap"
						px="xs"
					>
						{hasNavbarContent ? (
							<Burger
								opened={opened}
								onClick={toggle}
								hiddenFrom={navbarBreakpoint}
								size="sm"
							/>
						) : undefined}
						<AppBuilderContainerWrapper name="top">
							{top?.node}
						</AppBuilderContainerWrapper>
					</Group>
				</AppShell.Header>
				<AppShell.Navbar
					hidden={!opened}
					className={classes.appShellMainNavbar}
					withBorder={navbarBorder}
				>
					<AppBuilderContainerWrapper name="left">
						{left?.node}
					</AppBuilderContainerWrapper>
					{!bottom ? undefined : showBottomInGrid ? undefined : (
						<AppBuilderContainerWrapper
							name="bottom"
							orientation="vertical"
						>
							{bottom.node}
						</AppBuilderContainerWrapper>
					)}
					{!right ? undefined : !showRightInNavbar ? undefined : (
						<AppBuilderContainerWrapper name="right">
							{right.node}
						</AppBuilderContainerWrapper>
					)}
				</AppShell.Navbar>
				<AppShell.Main
					className={`${classes.appShellMain} ${showHeader ? classes.appShellMaxHeightBelowHeader : classes.appShellMaxHeight}`}
					style={rootStyle}
				>
					<section className={classes.appShellGridAreaMain}>
						{children}
					</section>
					{!right || showRightInNavbar ? undefined : (
						<section
							className={`${!showRightAtBottom ? classes.appShellGridAreaRight : classes.appShellGridAreaBottomPortrait}`}
							data-with-border={rightBorder ? true : undefined}
						>
							<AppBuilderContainerWrapper name="right">
								{right.node}
							</AppBuilderContainerWrapper>
						</section>
					)}
					{bottom && showBottomInGrid ? (
						<section className={classes.appShellGridAreaBottom}>
							<AppBuilderContainerWrapper
								orientation={
									bottom.hints?.preferVertical
										? "vertical"
										: undefined
								}
								name="bottom"
							>
								{bottom.node}
							</AppBuilderContainerWrapper>
						</section>
					) : undefined}
				</AppShell.Main>
			</AppShell>
		</>
	);
}
