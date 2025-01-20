import React from "react";
import { IAppBuilderWidgetPropsImage } from "../../../../types/shapediver/appbuilder";
import AppBuilderImage from "../AppBuilderImage";
import AppBuilderImageExportWidgetComponent from "./AppBuilderImageExportWidgetComponent";
import { ImageProps } from "@mantine/core";

interface Props extends IAppBuilderWidgetPropsImage {
	/**
	 * Default session namespace to use for parameter and export references that do
	 * not specify a session namespace.
	 */
	namespace: string,
	isSvg?: boolean
}

export default function AppBuilderImageWidgetComponent(props: Props & Pick<ImageProps, "maw" | "mah">) {
	const {
		alt,
		maw,
		mah,
		target,
		anchor,
		// AppBuilderImage
		href,
		// AppBuilderImageExportWidgetComponent
		export: exportRef,
		namespace,
		isSvg,
	} = props;

	const propsCommon = {
		anchor,
		alt,
		target,
	};

	if (href) {
		return <AppBuilderImage
			src={href}
			isSvg={isSvg}
			maw={maw}
			mah={mah}
			{ ...propsCommon }
		/>;
	} else if (exportRef) {
		return <AppBuilderImageExportWidgetComponent
			namespace={namespace}
			exportId={exportRef.name}
			{ ...propsCommon }
		/>;
	}

	return <></>;
}
