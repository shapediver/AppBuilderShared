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
	/**
	 * Minimum height of the PDF embed box (PDF has no intrinsic size).
	 * @default "50vh"
	 */
	mih?: string | number;
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
	mih: "50vh",
};

type AppBuilderPdfEmbedThemePropsType = Partial<AppBuilderPdfEmbedStyleProps>;

export function AppBuilderPdfEmbedThemeProps(
	props: AppBuilderPdfEmbedThemePropsType,
): MantineThemeComponent {
	return {
		defaultProps: props,
	};
}

function radiusToCssVar(radius: string | number | undefined): string | undefined {
	if (radius === undefined) return undefined;
	if (typeof radius === "number") return `${radius}px`;
	return `var(--mantine-radius-${radius})`;
}

export default function AppBuilderPdfEmbed(
	props: PdfEmbedNonStyleProps & AppBuilderPdfEmbedStyleProps,
) {
	const {src, alt, ...rest} = props;
	const {radius, fit, withBorder, mih, mah, maw} = useProps(
		"AppBuilderPdfEmbed",
		defaultStyleProps,
		rest,
	);

	const context = useContext(AppBuilderContainerContext);
	const orientation = context.orientation;
	const contain = fit === "contain";

	const className = [
		classes.root,
		withBorder ? classes.withBorder : "",
		contain && orientation === "horizontal"
			? classes.containHorizontal
			: "",
		contain && orientation === "vertical" ? classes.containVertical : "",
		!contain && orientation === "horizontal"
			? classes.scaleDownHorizontal
			: "",
		!contain && orientation === "vertical" ? classes.scaleDownVertical : "",
	]
		.join(" ")
		.trim();

	// Theme/style props only as CSS variables — no hardcoded visual CSS in JSX.
	const style = {
		...(radius !== undefined
			? {
					"--appbuilder-pdf-embed-radius": radiusToCssVar(radius),
				}
			: {}),
		...(mih !== undefined
			? {"--appbuilder-pdf-embed-mih": String(mih)}
			: {}),
		...(mah !== undefined
			? {"--appbuilder-pdf-embed-mah": String(mah)}
			: {}),
		...(maw !== undefined
			? {"--appbuilder-pdf-embed-maw": String(maw)}
			: {}),
	} as CSSProperties;

	const title = alt;

	return (
		<div className={className} style={style}>
			{/* Avoid nested iframe — double-fetch same PDF */}
			<object
				className={classes.embed}
				data={src}
				type="application/pdf"
				title={title}
				aria-label={title}
			>
				<p>
					Your browser does not support PDF viewing.{" "}
					<a href={src}>Download the PDF</a>.
				</p>
			</object>
		</div>
	);
}
