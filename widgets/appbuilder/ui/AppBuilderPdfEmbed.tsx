import {AppBuilderContainerContext} from "@AppBuilderLib/features/appbuilder/lib/AppBuilderContext";
import {MantineThemeComponent, useProps} from "@mantine/core";
import {type CSSProperties, useContext} from "react";
import classes from "./AppBuilderPdfEmbed.module.css";

/**
 * @docAttached
 * @category widget
 * @configPath themeOverrides.components.AppBuilderPdfEmbed.defaultProps
 * @displayName AppBuilderPdfEmbed
 */
export type AppBuilderPdfEmbedStyleProps = {
	/**
	 * Object-fit-like sizing for the embed box.
	 * @default "contain"
	 */
	fit?: "contain" | "scale-down";
	/**
	 * When true, applies bordered embed styling.
	 * @default false
	 */
	withBorder?: boolean;
	radius?: string | number;
	mah?: string | number;
	maw?: string | number;
};

type PdfEmbedNonStyleProps = {
	src: string;
	alt?: string;
};

const defaultStyleProps: Partial<AppBuilderPdfEmbedStyleProps> = {
	radius: "md",
	fit: "contain",
	withBorder: false,
};

type AppBuilderPdfEmbedThemePropsType = Partial<AppBuilderPdfEmbedStyleProps>;

export function AppBuilderPdfEmbedThemeProps(
	props: AppBuilderPdfEmbedThemePropsType,
): MantineThemeComponent {
	return {
		defaultProps: props,
	};
}

export default function AppBuilderPdfEmbed(
	props: PdfEmbedNonStyleProps & AppBuilderPdfEmbedStyleProps,
) {
	const {src, alt, ...rest} = props;
	const {radius, fit, withBorder, mah, maw} = useProps(
		"AppBuilderPdfEmbed",
		defaultStyleProps,
		rest,
	);

	const context = useContext(AppBuilderContainerContext);
	const orientation = context.orientation;
	const contain = fit === "contain";
	const sizeStyle: CSSProperties = {
		borderRadius:
			typeof radius === "number" ? radius : undefined,
		height: contain && orientation === "horizontal" ? "100%" : undefined,
		width: contain && orientation === "vertical" ? "100%" : undefined,
		maxHeight:
			!contain && orientation === "horizontal"
				? (mah ?? "100%")
				: undefined,
		maxWidth:
			!contain && orientation === "vertical"
				? (maw ?? "100%")
				: undefined,
	};

	if (typeof radius === "string") {
		sizeStyle.borderRadius = `var(--mantine-radius-${radius})`;
	}

	const className = [
		classes.root,
		withBorder ? classes.withBorder : undefined,
	]
		.filter(Boolean)
		.join(" ");

	const title = alt;

	return (
		<div className={className} style={sizeStyle}>
			<object
				className={classes.embed}
				data={src}
				type="application/pdf"
				title={title}
				aria-label={title}
				style={{height: "100%", width: "100%"}}
			>
				<iframe
					className={classes.embed}
					src={src}
					title={title}
					aria-label={title}
					style={{border: "none", height: "100%", width: "100%"}}
				>
					<p>
						Your browser does not support PDF viewing.{" "}
						<a href={src}>Download the PDF</a>.
					</p>
				</iframe>
			</object>
		</div>
	);
}
