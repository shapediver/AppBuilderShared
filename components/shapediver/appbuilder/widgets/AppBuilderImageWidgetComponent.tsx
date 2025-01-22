import React from "react";
import { IAppBuilderWidgetPropsImage } from "@AppBuilderShared/types/shapediver/appbuilder";
import AppBuilderImage from "@AppBuilderShared/components/shapediver/appbuilder/AppBuilderImage";
import AppBuilderImageExportWidgetComponent
	from "@AppBuilderShared/components/shapediver/appbuilder/widgets/AppBuilderImageExportWidgetComponent";

interface Props extends IAppBuilderWidgetPropsImage {
	/**
	 * Default session namespace to use for parameter and export references that do
	 * not specify a session namespace.
	 */
	namespace: string
}

export default function AppBuilderImageWidgetComponent(props: Props) {
	const {
		alt,
		target,
		anchor,
		// AppBuilderImage
		href,
		// AppBuilderImageExportWidgetComponent
		export: exportRef,
		namespace,
	} = props;

	const propsCommon = {
		anchor,
		alt,
		target
	};

	if (href) {
		return <AppBuilderImage
			src={href}
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
