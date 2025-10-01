import ExportLabelComponent from "@AppBuilderShared/components/shapediver/exports/ExportLabelComponent";
import Icon from "@AppBuilderShared/components/ui/Icon";
import TooltipWrapper from "@AppBuilderShared/components/ui/TooltipWrapper";
import {ExportInterceptorContext} from "@AppBuilderShared/context/ExportInterceptorContext";
import {NotificationContext} from "@AppBuilderShared/context/NotificationContext";
import {useExport} from "@AppBuilderShared/hooks/shapediver/parameters/useExport";
import {useParameterValueSources} from "@AppBuilderShared/hooks/shapediver/parameters/useParameterValueSources";
import {
	ExportStatusEnum,
	useStargateExport,
} from "@AppBuilderShared/hooks/shapediver/stargate/useStargateExport";
import {PropsExport} from "@AppBuilderShared/types/components/shapediver/propsExport";
import {
	IAppBuilderActionPropsSetParameterValue,
	IAppBuilderParameterValueSourceDefinition,
} from "@AppBuilderShared/types/shapediver/appbuilder";
import {
	IStargateComponentStatusDefinition,
	mapStargateComponentStatusDefinition,
	StargateFileParamPrefix,
	StargateStatusColorTypeEnum,
} from "@AppBuilderShared/types/shapediver/stargate";
import {
	Button,
	ButtonProps,
	Group,
	MantineThemeComponent,
	TooltipProps,
	useProps,
} from "@mantine/core";
import {EXPORT_TYPE} from "@shapediver/viewer.session";
import {fetchFileWithToken} from "@shapediver/viewer.utils.mime-type";
import React, {
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useState,
} from "react";
import StargateInput from "../stargate/StargateInput";
import {
	DefaultStargateStyleProps,
	StargateStyleProps,
} from "../stargate/stargateShared";

/**
 * Map from status enum to status data.
 */
const StatusDataMap: {
	[key in ExportStatusEnum]: IStargateComponentStatusDefinition;
} = {
	[ExportStatusEnum.notActive]: {
		colorType: StargateStatusColorTypeEnum.dimmed,
		message: "No active client found",
		disabled: true,
	},
	[ExportStatusEnum.incompatible]: {
		colorType: StargateStatusColorTypeEnum.dimmed,
		message: "Export not supported",
		disabled: true,
	},
	[ExportStatusEnum.active]: {
		colorType: StargateStatusColorTypeEnum.primary,
		message: "Export to client",
		disabled: false,
	},
};

interface StyleProps {
	buttonProps?: Partial<ButtonProps>;
	downloadTooltipProps: Partial<TooltipProps>;
	downloadButtonProps?: Partial<ButtonProps>;
}

const defaultStyleProps: Partial<StyleProps> = {
	buttonProps: {
		variant: "filled",
		fullWidth: true,
	},
	downloadTooltipProps: {
		position: "top",
		label: "Download file",
	},
	downloadButtonProps: {
		variant: "default",
	},
};

type ExportButtonComponentThemePropsType = Partial<StyleProps>;
export function ExportButtonComponentThemeProps(
	props: ExportButtonComponentThemePropsType,
): MantineThemeComponent {
	return {
		defaultProps: props,
	};
}

/**
 * Functional component that creates a button that triggers an export.
 * If the export is downloadable, that file will be downloaded.
 *
 * @returns
 */
export default function ExportButtonComponent(
	props: PropsExport &
		ExportButtonComponentThemePropsType &
		Partial<StargateStyleProps>,
) {
	const {
		buttonProps,
		downloadTooltipProps,
		downloadButtonProps,
		parameterValues,
		...rest
	} = useProps("ExportButtonComponent", defaultStyleProps, props);

	const {stargateColorProps} = useProps(
		"StargateShared",
		DefaultStargateStyleProps,
		rest,
	);

	const {definition, actions} = useExport(props) ?? {};
	const notifications = useContext(NotificationContext);

	if (!definition || !actions) {
		notifications.error({
			message: `Export ${props.exportId} not found`,
		});
		return <></>;
	}

	// get optional distribution-specific click interceptor and right section from context
	const {interceptClick, rightSection} = useContext(ExportInterceptorContext);

	// Criterion to determine if the export button shall use Stargate.
	const {isStargate, label} = useMemo(() => {
		const dn = definition.displayname || definition.name;
		return dn.startsWith(StargateFileParamPrefix)
			? {
					isStargate: definition.type === EXPORT_TYPE.DOWNLOAD,
					label: dn.substring(StargateFileParamPrefix.length),
				}
			: {
					isStargate: false,
					label: dn,
				};
	}, [definition]);

	const {isWaiting, isContentSupported, status, onExportFile} =
		useStargateExport({
			exportId: definition.id,
			contentIndex: 0,
			sessionId: props.namespace,
			increaseReferenceCount: isStargate,
		});

	const statusData = useMemo(() => {
		return mapStargateComponentStatusDefinition(
			StatusDataMap[status],
			stargateColorProps,
		);
	}, [status, stargateColorProps]);

	const exportRequest = useCallback(
		async (
			skipStargate?: boolean,
			parameterValues?: {[key: string]: string},
		) => {
			// request the export
			const response = await actions.request(parameterValues);

			// if the export is a download export, download it
			if (definition.type === EXPORT_TYPE.DOWNLOAD) {
				if (
					response.content &&
					response.content[0] &&
					response.content[0].href
				) {
					const content = response.content[0];
					if (!skipStargate && isStargate) {
						if (!(await isContentSupported(content))) {
							notifications.error({
								title: "Unsupported content type",
								message: `Content type ${content.format} not supported by the selected client.`,
							});
							return;
						}
						await onExportFile();
					} else {
						const url = content.href;
						const filename = response.filename?.endsWith(
							content.format,
						)
							? response.filename
							: `${response.filename}.${content.format}`;
						const sizemsg = content.size
							? ` (${Math.ceil(content.size / 1000)}kB)`
							: "";
						notifications.success({
							message: `Downloading file ${filename}${sizemsg}`,
						});
						const res = await actions.fetch(url);
						await fetchFileWithToken(res, filename);
					}
				} else if (
					response.content &&
					response.content.length === 0 &&
					response.msg
				) {
					notifications.success({
						message: response.msg,
					});
				}
			} else if (definition.type === EXPORT_TYPE.EMAIL) {
				// if the export is an email export, show the resulting message
				if (response.result) {
					const result = response.result;
					if (result.err) {
						notifications.error({
							message: result.err,
						});
					}
					if (result.msg) {
						notifications.success({
							message: result.msg,
						});
					}
				}
			}
		},
		[actions, definition.type, isStargate, isContentSupported],
	);

	const [requestingExport, setRequestingExport] = useState(false);

	const [sourceData, setSourceData] = useState<
		| {
				data: {
					namespace: string;
					sources: {
						source: IAppBuilderParameterValueSourceDefinition;
						parameterId: string;
						parameterNamespace?: string;
					}[];
				};
				information: {
					sourceMap: {
						[key: string]: number;
					};
					skipStargate?: boolean;
					parameterValues: IAppBuilderActionPropsSetParameterValue[];
				};
		  }
		| undefined
	>(undefined);

	const sourceResults = useParameterValueSources(sourceData?.data);

	useEffect(() => {
		if (!sourceData || !sourceResults) return;

		const parameterValues: {[key: string]: string} = {};
		for (const p of sourceData.information.parameterValues) {
			if (p.value) {
				parameterValues[p.parameter.name] = p.value;
			} else if (p.source) {
				// get the index of the source result for this parameter
				const sourceIndex =
					sourceData.information.sourceMap[p.parameter.name];
				if (sourceIndex === undefined) continue;
				const sourceResult = sourceResults[sourceIndex];
				if (sourceResult && typeof sourceResult === "string") {
					parameterValues[p.parameter.name] = sourceResult;
				}
			}
		}

		// request the export
		exportRequest(
			sourceData.information.skipStargate,
			parameterValues,
		).then(() => {
			// reset source data to avoid multiple calls
			setSourceData(undefined);
			// set the requestingExport false to remove the loading icon
			setRequestingExport(false);
		});
	}, [sourceResults, exportRequest]);

	// callback for when the export button has been clicked
	const onClick = useCallback(
		async (skipStargate?: boolean) => {
			// set the requestingExport true to display a loading icon
			setRequestingExport(true);

			// load sources if necessary
			const hasSources = parameterValues?.some((p) => p.source) ?? false;

			if (hasSources) {
				// we set the sources to be loaded asynchronously
				// and afterwards we request the export

				const information: {
					sourceMap: {[key: string]: number};
					skipStargate?: boolean;
					parameterValues: IAppBuilderActionPropsSetParameterValue[];
				} = {
					sourceMap: {},
					skipStargate,
					parameterValues: parameterValues!,
				};

				const sources = parameterValues!
					.map((p, index) => {
						if (p.source) {
							information.sourceMap[p.parameter.name] = index;
							return {
								source: p.source,
								parameterId: p.parameter.name,
								parameterNamespace: p.parameter.sessionId,
							};
						}
					})
					.filter((p) => p !== undefined);
				setSourceData({
					data: {
						namespace: props.namespace,
						sources: sources,
					},
					information,
				});
				return;
			} else {
				await exportRequest(
					skipStargate,
					parameterValues?.reduce(
						(acc, p) => {
							if (p.value) acc[p.parameter.name] = p.value;
							return acc;
						},
						{} as {[key: string]: string},
					),
				);
			}

			// set the requestingExport false to remove the loading icon
			setRequestingExport(false);
		},
		[exportRequest, parameterValues],
	);

	const onClickIntercepted = useCallback(
		(skipStargate?: boolean) =>
			interceptClick
				? interceptClick(() => onClick(skipStargate))
				: onClick(skipStargate),
		[onClick, interceptClick],
	);

	return (
		<>
			<ExportLabelComponent
				{...props}
				label={label}
				rightSection={rightSection}
			/>
			{definition &&
				(isStargate ? (
					<Group wrap="nowrap">
						<StargateInput
							icon={"tabler:device-desktop-down"}
							message={statusData.message}
							color={statusData.color}
							isWaiting={requestingExport || isWaiting}
							waitingText="Waiting for export..."
							disabled={statusData.disabled}
							onClick={() => onClickIntercepted()}
						/>
						<TooltipWrapper
							{...downloadTooltipProps}
							label={
								downloadTooltipProps?.label || "Download file"
							}
						>
							<Button
								{...downloadButtonProps}
								onClick={() => onClickIntercepted(true)}
								loading={requestingExport}
							>
								<Icon iconType={"tabler:download"} />
							</Button>
						</TooltipWrapper>
					</Group>
				) : (
					<Button
						{...buttonProps}
						leftSection={
							definition.type === EXPORT_TYPE.DOWNLOAD ? (
								<Icon iconType={"tabler:download"} />
							) : (
								<Icon iconType={"tabler:mail-forward"} />
							)
						}
						onClick={() => onClickIntercepted()}
						loading={requestingExport}
					>
						{definition.type === EXPORT_TYPE.DOWNLOAD
							? "Download File"
							: "Send Email"}
					</Button>
				))}
		</>
	);
}
