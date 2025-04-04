import Svg from "@AppBuilderShared/components/ui/Svg";
import {AppBuilderContainerContext} from "@AppBuilderShared/context/AppBuilderContext";
import {IAppBuilderWidgetPropsAnchor} from "@AppBuilderShared/types/shapediver/appbuilder";
import {
	Anchor,
	Image,
	ImageProps,
	MantineThemeComponent,
	useProps,
} from "@mantine/core";
import React, {useContext} from "react";
import classes from "./AppBuilderImage.module.css";

type Props = IAppBuilderWidgetPropsAnchor;

type ImageStyleProps = Pick<ImageProps, "radius" | "mah" | "maw"> & {
	fit?: "contain" | "scale-down";
	withBorder?: boolean;
	isSvg?: boolean;
};

type ImageNonStyleProps = Pick<ImageProps, "src"> & {alt?: string};

const defaultStyleProps: Partial<ImageStyleProps> = {
	radius: "md",
	/**
	 * Object-fit behavior to use for image widgets. This roughly follows the
	 * behavior defined by https://developer.mozilla.org/en-US/docs/Web/CSS/object-fit
	 *
	 *   * contain: The image is scaled to maintain its aspect ratio and to fill 100%
	 *              of the available width or height of the App Builder container
	 *              (depending on the orientation of the container).
	 *
	 *   * scale-down: The image is sized as if the value were "contain", but the
	 *                 image will not be grown to more than 100% of its original size.
	 */
	fit: "contain",
	withBorder: false,
};

type AppBuilderImageThemePropsType = Partial<ImageStyleProps>;

export function AppBuilderImageThemeProps(
	props: AppBuilderImageThemePropsType,
): MantineThemeComponent {
	return {
		defaultProps: props,
	};
}

export default function AppBuilderImage(
	props: ImageNonStyleProps & ImageStyleProps & Props,
) {
	const {anchor, target, isSvg, ...rest} = props;
	const {radius, fit, withBorder, mah, maw} = useProps(
		"AppBuilderImage",
		defaultStyleProps,
		rest,
	);

	const context = useContext(AppBuilderContainerContext);
	const orientation = context.orientation;
	const contain = fit === "contain";
	const contentProps = {
		...rest,
		fit: fit,
		radius: radius,
		h: contain && orientation === "horizontal" ? "100%" : undefined,
		w: contain && orientation === "vertical" ? "100%" : undefined,
		mah:
			!contain && orientation === "horizontal"
				? (mah ?? "100%")
				: undefined,
		maw:
			!contain && orientation === "vertical"
				? (maw ?? "100%")
				: undefined,
		className: withBorder ? classes.imgBorder : undefined,
	};

	const element = isSvg ? (
		<Svg {...contentProps} srcUrl={rest.src} />
	) : (
		<Image {...contentProps} />
	);

	return anchor ? (
		/**
		 * Note: In case isSvg === true, the SVG might define its own anchor elements.
		 * Tests have shown that anchors defined in the SVG take precedence over the
		 * anchor defined here.
		 */
		<Anchor href={anchor} target={target} display="contents">
			{element}
		</Anchor>
	) : (
		element
	);
}
