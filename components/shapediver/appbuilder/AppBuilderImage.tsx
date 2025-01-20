import React, { useContext } from "react";
import { Image, ImageProps, MantineThemeComponent, Anchor, useProps } from "@mantine/core";
import { IAppBuilderWidgetPropsAnchor } from "../../../types/shapediver/appbuilder";
import { AppBuilderContainerContext } from "../../../context/AppBuilderContext";
import classes from "./AppBuilderImage.module.css";
import Svg from "../../ui/Svg";

type Props = IAppBuilderWidgetPropsAnchor;

type ImageStyleProps = Pick<ImageProps, "radius" | "mah" | "maw"> & {
	fit?: "contain" | "scale-down",
	withBorder?: boolean,
	isSvg?: boolean
};

type ImageNonStyleProps = Pick<ImageProps, "src"> & { alt?: string};

const defaultStyleProps : Partial<ImageStyleProps> = {
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

export function AppBuilderImageThemeProps(props: AppBuilderImageThemePropsType): MantineThemeComponent {
	return {
		defaultProps: props
	};
}

export default function AppBuilderImage(props: ImageNonStyleProps & ImageStyleProps & Props ) {
	const { anchor, target, isSvg,  ...rest } = props;
	const { radius, fit, withBorder, mah, maw } = useProps("AppBuilderImage", defaultStyleProps, rest);

	const context = useContext(AppBuilderContainerContext);
	const orientation = context.orientation;
	const contain = fit === "contain";
	const contentProps = {
		...rest,
		fit: fit,
		radius: radius,
		h: contain && orientation === "horizontal" ? "100%" : undefined,
		w: contain && orientation === "vertical" ? "100%" : undefined,
		className: withBorder ? classes.imgBorder : undefined,
	};

	const element = isSvg ? (
		<Svg
			{...contentProps}
			srcUrl={rest.src}
			mah={mah}
			maw={maw}
		/>
	) : (
		<Image
			{...contentProps}
			mah={!contain && orientation === "horizontal" ? mah ?? "100%" : undefined}
			maw={!contain && orientation === "vertical" ? maw ?? "100%" : undefined}
		/>
	);

	return anchor ? (
		<Anchor // Notice: SVG may contains own urls, potential conflict can happen
			href={anchor}
			target={target}
			display="contents"
		>
			{element}
		</Anchor>
	) : element;
}
