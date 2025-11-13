import ViewportAnchor2d from "@AppBuilderShared/components/shapediver/viewport/anchors/ViewportAnchor2d";
import {useIsLandscape} from "@AppBuilderShared/hooks/ui/useIsLandscape";
import {useResponsiveValueSelector} from "@AppBuilderShared/hooks/ui/useResponsiveValueSelector";
import AppBuilderContainerWrapper from "@AppBuilderShared/pages/templates/AppBuilderContainerWrapper";
import {IAppBuilderTemplatePageProps} from "@AppBuilderShared/types/pages/appbuildertemplates";
import {createGridLayout} from "@AppBuilderShared/utils/misc/layout";
import {
	AppShell,
	Group,
	MantineThemeComponent,
	useMantineTheme,
	useProps,
} from "@mantine/core";
import {useMediaQuery} from "@mantine/hooks";
import {TAG3D_JUSTIFICATION} from "@shapediver/viewer.session";
import React, {useEffect, useMemo, useState} from "react";
import AppBuilderAppShellTemplatePage, {
	AppBuilderAppShellTemplatePageThemePropsType,
	defaultStyleProps,
	StyleProps,
} from "./AppBuilderAppShellTemplatePage";
import classes from "./AppBuilderAppShellTemplatePage.module.css";

export function AppBuilderFloatingTemplatePageThemeProps(
	props: AppBuilderAppShellTemplatePageThemePropsType,
): MantineThemeComponent {
	return {
		defaultProps: props,
	};
}

/**
 * AppShell layout template page for AppBuilder with floating containers.
 * This template is partially based on Mantine's AppShell component, but uses
 * floating containers for the left, right, and bottom areas.
 * The bottom container is shown at the bottom of the main container if and only if
 * the device is in landscape mode and the width is above the navbar breakpoint.
 * Otherwise the bottom container is shown as part of the navigation bar area,
 * using vertical layout.
 * @see https://mantine.dev/core/app-shell/
 * @param
 * @returns
 */
export default function AppBuilderFloatingTemplatePage(
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
		headerHeight: _headerHeight,
		navbarBreakpoint,
		navbarWidth,
		columns: _columns,
		rows: _rows,
		rightColumns: _rightColumns,
		bottomRows: _bottomRows,
		bottomFullWidth: _bottomFullWidth,
		headerBorder,
	} = useProps("AppBuilderFloatingTemplatePage", defaultStyleProps, props);

	const isLandscape = useIsLandscape();
	const theme = useMantineTheme();

	// Force the initial state to desktop to prevent layout shift
	const [initialRender, setInitialRender] = useState(true);
	const aboveNavbarBreakpoint = useMediaQuery(
		`(min-width: ${theme.breakpoints[navbarBreakpoint]})`,
		// Default to true to prevent layout shift on first render
		true,
	);

	useEffect(() => {
		// Mark that we've completed the initial render
		setTimeout(() => {
			setInitialRender(false);
		}, 1);
	}, []);

	const columns = useResponsiveValueSelector(_columns);
	const rows = useResponsiveValueSelector(_rows);
	const rightColumns = useResponsiveValueSelector(_rightColumns);
	const bottomRows = useResponsiveValueSelector(_bottomRows);
	const bottomFullWidth = useResponsiveValueSelector(_bottomFullWidth);
	const headerHeight = useResponsiveValueSelector(_headerHeight);

	const [rootStyle, setRootStyle] = useState<React.CSSProperties>({
		...createGridLayout({
			hasRight: false,
			hasBottom: false,
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
				hasRight: false,
				hasBottom: false,
				rows,
				columns,
				rightColumns,
				bottomRows,
				bottomFullWidth,
			}),
		});
	}, [columns, rows, rightColumns, bottomRows, bottomFullWidth]);

	const paddingValue = "20px";
	const spacingValue = "1rem";

	const paddingOffset = (numberOfPaddings: number) => {
		return `calc(${numberOfPaddings} * ${paddingValue})`;
	};

	const spacingOffset = (numberOfSpacings: number) => {
		return `calc(${numberOfSpacings} * ${spacingValue})`;
	};

	const leftContainerSettings = useMemo(() => {
		return {
			location: ["1rem", "1rem"],
			width: "20rem",
			height: top
				? `calc(100dvh - ${headerHeight} - ${spacingOffset(2)} - ${paddingOffset(1)})`
				: `calc(100dvh - ${spacingOffset(2)} - ${paddingOffset(1)})`,
		};
	}, [top, headerHeight]);

	const rightContainerSettings = useMemo(() => {
		return {
			location: ["calc(100% - 1rem)", "1rem"],
			width: "20rem",
			height: top
				? `calc(100dvh - ${headerHeight} - ${spacingOffset(2)} - ${paddingOffset(1)})`
				: `calc(100dvh - ${spacingOffset(2)} - ${paddingOffset(1)})`,
		};
	}, [top, headerHeight]);

	const bottomContainerSettings = useMemo(() => {
		return {
			location: [
				left
					? `calc(20rem + ${spacingValue} + ${spacingValue} + ${paddingValue})`
					: spacingValue,
				`calc(100% - 10rem - ${spacingValue} - ${paddingValue})`,
			],
			width:
				left && right
					? `calc(100dvw - 40rem - ${spacingOffset(4)} - ${paddingOffset(3)} )`
					: right || left
						? `calc(100dvw - 20rem - ${spacingOffset(3)} - ${paddingOffset(2)} )`
						: `calc(100dvw - ${spacingOffset(2)} - ${paddingOffset(1)} )`,
			height: "10rem",
		};
	}, [left, right]);

	return !aboveNavbarBreakpoint || !isLandscape ? (
		<AppBuilderAppShellTemplatePage {...props} />
	) : (
		<div
			className={
				initialRender
					? classes.containerHidden
					: classes.containerVisible
			}
		>
			<AppShell
				padding="0"
				// We hide the header in case there is no top and no left container content.
				// In case there left container content, we only show the header below the navbar breakpoint
				// (see hiddenFrom prop of AppShell.Header).
				header={{height: headerHeight, collapsed: !top}}
				navbar={{
					breakpoint: navbarBreakpoint,
					width: navbarWidth,
					collapsed: {
						desktop: true,
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
						<AppBuilderContainerWrapper name="top">
							{top?.node}
						</AppBuilderContainerWrapper>
					</Group>
				</AppShell.Header>
				<AppShell.Main
					className={`${classes.appShellMain} ${!!top ? classes.appShellMaxHeightBelowHeader : classes.appShellMaxHeight}`}
					style={rootStyle}
				>
					<section className={classes.appShellGridAreaMain}>
						{children}
					</section>

					{left ? (
						<ViewportAnchor2d
							id={"left"}
							location={leftContainerSettings.location}
							justification={TAG3D_JUSTIFICATION.TOP_LEFT}
							draggable={false}
							width={leftContainerSettings.width}
							height={leftContainerSettings.height}
							element={
								<AppBuilderContainerWrapper name="left">
									{left.node}
								</AppBuilderContainerWrapper>
							}
						/>
					) : undefined}

					{right ? (
						<ViewportAnchor2d
							id={"right"}
							location={rightContainerSettings.location}
							justification={TAG3D_JUSTIFICATION.TOP_RIGHT}
							draggable={false}
							width={rightContainerSettings.width}
							height={rightContainerSettings.height}
							element={
								<AppBuilderContainerWrapper name="right">
									{right.node}
								</AppBuilderContainerWrapper>
							}
						/>
					) : undefined}

					{bottom ? (
						<ViewportAnchor2d
							id={"bottom"}
							location={bottomContainerSettings.location}
							justification={TAG3D_JUSTIFICATION.TOP_LEFT}
							draggable={false}
							width={bottomContainerSettings.width}
							height={bottomContainerSettings.height}
							element={
								<AppBuilderContainerWrapper name="bottom">
									{bottom.node}
								</AppBuilderContainerWrapper>
							}
						/>
					) : undefined}
				</AppShell.Main>
			</AppShell>
		</div>
	);
}
