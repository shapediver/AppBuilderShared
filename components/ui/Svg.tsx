import React, {useEffect, useState} from "react";
import {StyleProp} from "@mantine/core";
import {MantineSize} from "@mantine/core/lib/core/MantineProvider/theme.types";
import {MantineRadius} from "@mantine/core/lib/core";

interface SvgProps {
	srcUrl: string;
	h?: StyleProp<React.CSSProperties["height"]>;
	w?: StyleProp<React.CSSProperties["width"]>;
	maw?: StyleProp<React.CSSProperties["maxWidth"]>;
	mah?: StyleProp<React.CSSProperties["maxHeight"]>;
	fit?: React.CSSProperties["objectFit"];
	radius?: MantineRadius;
	className?: string;
}

const radiusSizes: Record<MantineSize, boolean> = {
	xs: true,
	sm: true,
	md: true,
	lg: true,
	xl: true,
};

export default function Svg(props: SvgProps) {
	const {srcUrl, h, w, maw, mah, fit, className, radius} = props;
	const [svgElement, setSvgElement] = useState<HTMLElement | null>(null);

	useEffect(() => {
		fetch(srcUrl)
			.then((res) => res.text())
			.then((svgString) => {
				const parser = new DOMParser();
				const svgDoc = parser.parseFromString(
					svgString,
					"image/svg+xml",
				);
				const element = svgDoc.documentElement;

				element.setAttribute(
					"width",
					w !== undefined ? String(w) : "auto",
				);
				element.setAttribute(
					"height",
					h !== undefined ? String(h) : "auto",
				);
				if (fit !== undefined) element.style["objectFit"] = fit;

				if (maw !== undefined) element.style["maxWidth"] = String(maw);
				if (mah !== undefined) element.style["maxHeight"] = String(mah);
				if (className !== undefined) element.classList.add(className);
				// Check if radius value is compatible with MantineRadiusValues use css variable else set raw value
				const radiusValue =
					radius &&
					Object.prototype.hasOwnProperty.call(radiusSizes, radius)
						? `var(--mantine-radius-${radius}, 0)`
						: radius;
				if (radiusValue !== undefined)
					element.style["borderRadius"] = String(radiusValue);

				setSvgElement(element);
			});
	}, [srcUrl]);

	if (svgElement)
		return (
			<section
				style={{height: "inherit"}}
				ref={(ref) => ref?.appendChild(svgElement)}
			/>
		);

	return <div />;
}
