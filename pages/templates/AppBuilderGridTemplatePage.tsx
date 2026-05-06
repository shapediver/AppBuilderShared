import {createGridLayout} from "@AppBuilderLib/shared/lib";
import AppBuilderContainerWrapper from "@AppBuilderShared/pages/templates/AppBuilderContainerWrapper";
import {MantineThemeComponent, useProps} from "@mantine/core";
import React, {useEffect, useRef, useState} from "react";
import {IAppBuilderTemplatePageProps} from "../config";
import classes from "./AppBuilderGridTemplatePage.module.css";

/**
 * @docAttached
 * @configPath themeOverrides.components.AppBuilderGridTemplatePage.defaultProps
 * @displayName AppBuilderGridTemplatePage
 */
export interface StyleProps {
	/**
	 * Top background color
	 * @default "transparent"
	 */
	bgTop: string;
	/**
	 * Left background color
	 * @default "transparent"
	 */
	bgLeft: string;
	/**
	 * Right background color
	 * @default "transparent"
	 */
	bgRight: string;
	/**
	 * Bottom background color
	 * @default "transparent"
	 */
	bgBottom: string;
	/**
	 * Number of grid columns
	 * @default 4
	 */
	columns: number;
	/**
	 * Number of grid rows
	 * @default 4
	 */
	rows: number;
	/**
	 * Number of columns for left container
	 * @default 1
	 */
	leftColumns: number;
	/**
	 * Number of columns for right container
	 * @default 1
	 */
	rightColumns: number;
	/**
	 * Number of rows for top container
	 * @default 1
	 */
	topRows: number;
	/**
	 * Number of rows for bottom container
	 * @default 1
	 */
	bottomRows: number;
	/**
	 * Shall the top container use the full width?
	 * @default false
	 */
	topFullWidth: boolean;
	/**
	 * Shall the bottom container use the full width?
	 * @default false
	 */
	bottomFullWidth: boolean;
}

const defaultStyleProps: StyleProps = {
	bgTop: "transparent",
	bgLeft: "transparent",
	bgRight: "transparent",
	bgBottom: "transparent",
	columns: 4,
	rows: 4,
	leftColumns: 1,
	rightColumns: 1,
	topRows: 1,
	bottomRows: 1,
	topFullWidth: false,
	bottomFullWidth: false,
};

type AppBuilderGridTemplatePageThemePropsType = Partial<StyleProps>;

export function AppBuilderGridTemplatePageThemeProps(
	props: AppBuilderGridTemplatePageThemePropsType,
): MantineThemeComponent {
	return {
		defaultProps: props,
	};
}

/**
 * Grid layout template page for AppBuilder
 * @param props
 * @returns
 */
export default function AppBuilderGridTemplatePage(
	props: IAppBuilderTemplatePageProps & Partial<StyleProps>,
) {
	const {
		top = undefined,
		left = undefined,
		children = undefined,
		right = undefined,
		bottom = undefined,
	} = props;

	// style properties
	const {
		bgTop,
		bgLeft,
		bgRight,
		bgBottom,
		columns,
		rows,
		leftColumns,
		rightColumns,
		topRows,
		bottomRows,
		topFullWidth,
		bottomFullWidth,
	} = useProps("AppBuilderGridTemplatePage", defaultStyleProps, props);

	const rootRef = useRef<HTMLDivElement>(null);
	const [rootStyle, setRootStyle] = useState<React.CSSProperties>({
		// We need to define the background color here, because the corresponding element
		// is used for fullscreen mode and would otherwise be transparent (show as black).
		backgroundColor: "var(--mantine-color-body)",
		...createGridLayout({
			hasTop: !!top,
			hasLeft: !!left,
			hasRight: !!right,
			hasBottom: !!bottom,
			rows,
			columns,
			topRows,
			leftColumns,
			rightColumns,
			bottomRows,
			topFullWidth,
			bottomFullWidth,
		}),
	});

	useEffect(() => {
		setRootStyle({
			...rootStyle,
			...createGridLayout({
				hasTop: !!top,
				hasLeft: !!left,
				hasRight: !!right,
				hasBottom: !!bottom,
				rows,
				columns,
				topRows,
				leftColumns,
				rightColumns,
				bottomRows,
				topFullWidth,
				bottomFullWidth,
			}),
		});
	}, [
		left,
		right,
		bottom,
		top,
		columns,
		rows,
		leftColumns,
		rightColumns,
		topRows,
		bottomRows,
		topFullWidth,
		bottomFullWidth,
	]);

	return (
		<>
			<section
				ref={rootRef}
				className={classes.appBuilderTemplatePage}
				style={rootStyle}
			>
				{top ? (
					<section
						className={classes.appBuilderTemplatePageTop}
						style={{background: bgTop}}
					>
						<AppBuilderContainerWrapper name="top">
							{top.node}
						</AppBuilderContainerWrapper>
					</section>
				) : undefined}

				{left ? (
					<section
						className={classes.appBuilderTemplatePageLeft}
						style={{background: bgLeft}}
					>
						<AppBuilderContainerWrapper name="left">
							{left.node}
						</AppBuilderContainerWrapper>
					</section>
				) : undefined}

				{right ? (
					<section
						className={classes.appBuilderTemplatePageRight}
						style={{background: bgRight}}
					>
						<AppBuilderContainerWrapper name="right">
							{right.node}
						</AppBuilderContainerWrapper>
					</section>
				) : undefined}

				{bottom ? (
					<section
						className={classes.appBuilderTemplatePageBottom}
						style={{background: bgBottom}}
					>
						<AppBuilderContainerWrapper name="bottom">
							{bottom.node}
						</AppBuilderContainerWrapper>
					</section>
				) : undefined}

				<section className={classes.appBuilderTemplatePageMain}>
					{children || <></>}
				</section>
			</section>
		</>
	);
}
