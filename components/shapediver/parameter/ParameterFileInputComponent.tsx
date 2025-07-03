import ParameterLabelComponent from "@AppBuilderShared/components/shapediver/parameter/ParameterLabelComponent";
import ParameterWrapperComponent from "@AppBuilderShared/components/shapediver/parameter/ParameterWrapperComponent";
import Icon, {IconProps} from "@AppBuilderShared/components/ui/Icon";
import TooltipWrapper from "@AppBuilderShared/components/ui/TooltipWrapper";
import {useParameterComponentCommons} from "@AppBuilderShared/hooks/shapediver/parameters/useParameterComponentCommons";
import {
	ParameterStatusEnum,
	useStargateParameter,
} from "@AppBuilderShared/hooks/shapediver/stargate/useStargateParameter";
import {
	defaultPropsParameterWrapper,
	PropsParameter,
	PropsParameterWrapper,
} from "@AppBuilderShared/types/components/shapediver/propsParameter";
import {IconTypeEnum} from "@AppBuilderShared/types/shapediver/icons";
import {
	IStargateComponentStatusDefinition,
	mapStargateComponentStatusDefinition,
	StargateFileParamPrefix,
	StargateStatusColorTypeEnum,
} from "@AppBuilderShared/types/shapediver/stargate";
import {
	ActionIcon,
	ActionIconProps,
	FileInput,
	Group,
	MantineThemeComponent,
	TooltipProps,
	useProps,
} from "@mantine/core";
import {isFileParameterApi} from "@shapediver/viewer.session";
import {
	extendMimeTypes,
	guessMissingMimeType,
	mapMimeTypeToFileEndings,
} from "@shapediver/viewer.utils.mime-type";
import React, {useEffect, useMemo} from "react";
import StargateInput from "../stargate/StargateInput";
import {
	DefaultStargateStyleProps,
	StargateStyleProps,
} from "../stargate/stargateShared";

/**
 * Map from status enum to status data.
 */
const StatusDataMap: {
	[key in ParameterStatusEnum]: IStargateComponentStatusDefinition;
} = {
	[ParameterStatusEnum.notActive]: {
		colorType: StargateStatusColorTypeEnum.dimmed,
		message: "No active client found",
		disabled: true,
	},
	[ParameterStatusEnum.incompatible]: {
		colorType: StargateStatusColorTypeEnum.dimmed,
		message: "Incompatible input",
		disabled: true,
	},
	[ParameterStatusEnum.noObjectSelected]: {
		colorType: StargateStatusColorTypeEnum.focused,
		message: "No file imported",
		disabled: false,
	},
	[ParameterStatusEnum.objectSelected]: {
		colorType: StargateStatusColorTypeEnum.primary,
		message: "File imported",
		disabled: false,
	},
	[ParameterStatusEnum.unsupported]: {
		colorType: StargateStatusColorTypeEnum.dimmed,
		message: "Unsupported input status",
		disabled: true,
	},
};

interface StyleProps {
	cancelTooltipProps: Partial<TooltipProps>;
	cancelActionIconProps: Partial<ActionIconProps>;
	cancelIconProps: IconProps;
	uploadTooltipProps: Partial<TooltipProps>;
}

const defaultStyleProps: StyleProps = {
	cancelTooltipProps: {
		position: "top",
		label: "Drop imported file",
	},
	cancelActionIconProps: {
		size: "1.5rem",
		variant: "transparent",
		loaderProps: {
			type: "dots",
		},
	},
	cancelIconProps: {
		type: IconTypeEnum.Cancel,
		size: "1.2rem",
		color: "var(--mantine-color-default-color)",
	},
	uploadTooltipProps: {
		position: "top",
		label: "Upload file",
	},
};

type ParameterFileInputComponentThemePropsType = Partial<StyleProps>;

export function ParameterFileInputComponentThemeProps(
	props: ParameterFileInputComponentThemePropsType,
): MantineThemeComponent {
	return {
		defaultProps: props,
	};
}

/**
 * Functional component that creates a file input for a file parameter.
 *
 * @returns
 */
export default function ParameterFileInputComponent(
	props: PropsParameter &
		Partial<PropsParameterWrapper> &
		Partial<StyleProps> &
		Partial<StargateStyleProps>,
) {
	const {definition, value, state, handleChange, onCancel, disabled} =
		useParameterComponentCommons<File>(props, 0);

	const {
		cancelTooltipProps,
		cancelActionIconProps,
		cancelIconProps,
		uploadTooltipProps,
		...rest
	} = useProps("ParameterFileInputComponent", defaultStyleProps, props);

	const {wrapperComponent, wrapperProps} = useProps(
		"ParameterFileInputComponent",
		defaultPropsParameterWrapper,
		rest,
	);

	const {stargateColorProps} = useProps(
		"StargateShared",
		DefaultStargateStyleProps,
		rest,
	);

	// Criterion to determine if the parameter shall use Stargate.
	const {isStargate, label} = useMemo(() => {
		const dn = definition.displayname || definition.name;
		return dn.startsWith(StargateFileParamPrefix)
			? {
					isStargate: true,
					label: dn.substring(StargateFileParamPrefix.length),
				}
			: {
					isStargate: false,
					label: dn,
				};
	}, [definition]);

	// File parameters can optionally use Stargate to import files.
	const {status, onObjectAdd, onClearSelection, isWaiting} =
		useStargateParameter({
			parameterId: definition.id,
			parameterType: definition.type,
			hasValue: !!value,
			parameterFormat: definition.format,
			handleChange,
			increaseReferenceCount: isStargate,
		});

	const statusData = useMemo(() => {
		return mapStargateComponentStatusDefinition(
			StatusDataMap[status],
			stargateColorProps,
		);
	}, [status, stargateColorProps]);

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
			<ParameterLabelComponent
				{...props}
				label={label}
				cancel={onCancel}
				rightSection={
					onCancel || !isStargate ? undefined : (
						<TooltipWrapper
							{...cancelTooltipProps}
							label={
								cancelTooltipProps.label || "Drop imported file"
							}
						>
							<ActionIcon
								{...cancelActionIconProps}
								style={{
									visibility: value ? "visible" : "hidden",
								}}
								color={disabled ? "gray" : statusData.color}
								loading={isWaiting}
								disabled={isWaiting || disabled}
								onClick={onClearSelection}
							>
								<Icon {...cancelIconProps} />
							</ActionIcon>
						</TooltipWrapper>
					)
				}
			/>
			{definition &&
				(isStargate ? (
					<Group wrap="nowrap">
						<StargateInput
							message={statusData.message}
							color={statusData.color}
							isWaiting={isWaiting}
							waitingText="Waiting for import..."
							disabled={statusData.disabled || disabled}
							onClick={onObjectAdd}
							icon={IconTypeEnum.DeviceDesktopUp}
						/>
						<TooltipWrapper
							{...uploadTooltipProps}
							label={uploadTooltipProps.label || "Upload file"}
						>
							<FileInput
								accept={fileEndings.join(",")}
								clearable={false}
								onChange={(v) =>
									handleChange(guessMissingMimeType(v || ""))
								}
								leftSection={
									<Icon type={IconTypeEnum.Upload} />
								}
								leftSectionPointerEvents="none"
								disabled={disabled}
								valueComponent={() => null}
								value={
									typeof value === "string"
										? value === definition.defval
											? defaultFile
											: null
										: value
								}
							></FileInput>
						</TooltipWrapper>
					</Group>
				) : (
					<FileInput
						placeholder="File upload"
						accept={fileEndings.join(",")}
						clearable={!!state.execValue}
						onChange={(v) =>
							handleChange(guessMissingMimeType(v || ""))
						}
						leftSection={<Icon type={IconTypeEnum.Upload} />}
						leftSectionPointerEvents="none"
						disabled={disabled}
						valueComponent={undefined}
						value={
							typeof value === "string"
								? value === definition.defval
									? defaultFile
									: null
								: value
						}
					/>
				))}
		</ParameterWrapperComponent>
	);
}
