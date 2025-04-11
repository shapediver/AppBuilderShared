import ParameterLabelComponent from "@AppBuilderShared/components/shapediver/parameter/ParameterLabelComponent";
import ParameterWrapperComponent from "@AppBuilderShared/components/shapediver/parameter/ParameterWrapperComponent";
import Icon from "@AppBuilderShared/components/ui/Icon";
import {useParameterComponentCommons} from "@AppBuilderShared/hooks/shapediver/parameters/useParameterComponentCommons";
import {
	defaultPropsParameterWrapper,
	PropsParameter,
	PropsParameterWrapper,
} from "@AppBuilderShared/types/components/shapediver/propsParameter";
import {IconTypeEnum} from "@AppBuilderShared/types/shapediver/icons";
import {FileInput, useProps} from "@mantine/core";
import {isFileParameterApi} from "@shapediver/viewer.session";
import {
	extendMimeTypes,
	guessMissingMimeType,
	mapMimeTypeToFileEndings,
} from "@shapediver/viewer.utils.mime-type";
import React, {useEffect, useMemo} from "react";

/**
 * Functional component that creates a file input for a file parameter.
 *
 * @returns
 */
export default function ParameterFileInputComponent(
	props: PropsParameter & Partial<PropsParameterWrapper>,
) {
	const {definition, value, state, handleChange, onCancel, disabled} =
		useParameterComponentCommons<File>(props, 0);

	const {wrapperComponent, wrapperProps} = useProps(
		"ParameterFileInputComponent",
		defaultPropsParameterWrapper,
		props,
	);

	// create the file endings from all the formats that are specified in the parameter
	const fileEndings = useMemo(() => {
		const mimeTypes = extendMimeTypes(definition.format!);
		return [...mapMimeTypeToFileEndings(mimeTypes), ...mimeTypes];
	}, [definition.format]);

	// create a pseudo file in case the value is a file id and a filename for it exists
	const [defaultFile, setDefaultFile] = React.useState<File | null>(null);
	useEffect(() => {
		if (
			typeof value === "string" &&
			value.length > 0 &&
			isFileParameterApi(definition)
		) {
			definition
				.getFilename(value)
				.then((filename) =>
					setDefaultFile(
						new File([], filename ?? "(Filename unknown)"),
					),
				)
				.catch((error) =>
					console.error(
						`Error getting filename for file with id ${value}`,
						error,
					),
				);
		} else {
			setDefaultFile(null);
		}
	}, [value]);

	return (
		<ParameterWrapperComponent
			onCancel={onCancel}
			component={wrapperComponent}
			{...wrapperProps}
		>
			<ParameterLabelComponent {...props} cancel={onCancel} />
			{definition && (
				<FileInput
					placeholder="File Upload"
					accept={fileEndings.join(",")}
					clearable={!!state.execValue}
					onChange={(v) =>
						handleChange(guessMissingMimeType(v || ""))
					}
					leftSection={<Icon type={IconTypeEnum.Upload} />}
					disabled={disabled}
					value={
						typeof value === "string"
							? value === definition.defval
								? defaultFile
								: null
							: value
					}
				/>
			)}
		</ParameterWrapperComponent>
	);
}
