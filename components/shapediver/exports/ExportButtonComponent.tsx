import {
	IStargateComponentStatusDefinition,
	mapStargateComponentStatusDefinition,
	StargateFileParamPrefix,
	StargateStatusColorTypeEnum,
} from "@AppBuilderLib/entities/stargate/config/stargate";
import {
	ExportStatusEnum,
	useStargateExport,
} from "@AppBuilderLib/entities/stargate/model/useStargateExport";
import StargateInput from "@AppBuilderLib/entities/stargate/ui/StargateInput";
import {
	DefaultStargateStyleProps,
	StargateStyleProps,
} from "@AppBuilderLib/entities/stargate/ui/stargateShared";
import {useNotificationStore} from "@AppBuilderLib/features/notifications";
import {Icon} from "@AppBuilderLib/shared/ui/icon";
import {TooltipWrapper} from "@AppBuilderLib/shared/ui/tooltip";
import ExportLabelComponent from "@AppBuilderShared/components/shapediver/exports/ExportLabelComponent";
import {ExportInterceptorContext} from "@AppBuilderLib/shared/lib/ExportInterceptorContext";
import {useExport} from "@AppBuilderShared/hooks/shapediver/parameters/useExport";
import {
	ParameterValueDefinition,
	useResolveParameterValues,
} from "@AppBuilderShared/hooks/shapediver/parameters/useResolveParameterValues";
import {
	IParameterValues,
	PropsExportWithForm,
} from "@AppBuilderShared/types/components/shapediver/propsExport";
import {IAppBuilderActionPropsSetParameterValue} from "@AppBuilderShared/types/shapediver/appbuilder";
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
	props: PropsExportWithForm &
		ExportButtonComponentThemePropsType &
		Partial<StargateStyleProps>,
) {
	const {form, onSuccess, onError} = props;
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
	const notifications = useNotificationStore();

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

	const [parameterValueSourcesData, setParameterValueSourcesData] = useState<
		| {
				data: {
					namespace: string;
					parameterValues: ParameterValueDefinition[];
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

	const parameterValueSourcesResults = useResolveParameterValues(
		parameterValueSourcesData?.data,
	);

	useEffect(() => {
		if (!parameterValueSourcesData || !parameterValueSourcesResults) return;

		const parameterValues: {[key: string]: string} = {};
		for (const p of parameterValueSourcesData.information.parameterValues) {
			if (p.value) {
				parameterValues[p.parameter.name] = p.value;
			} else if (p.source) {
				// get the index of the source result for this parameter
				const sourceIndex =
					parameterValueSourcesData.information.sourceMap[
						p.parameter.name
					];
				if (sourceIndex === undefined) continue;
				const sourceResult = parameterValueSourcesResults[sourceIndex];
				if (sourceResult && typeof sourceResult === "string") {
					parameterValues[p.parameter.name] = sourceResult;
				}
			}
		}

		// request the export
		exportRequest(
			parameterValueSourcesData.information.skipStargate,
			parameterValues,
		)
			.then(() => {
				// Call onSuccess if provided
				if (onSuccess) {
					onSuccess(parameterValues);
				}
			})
			.catch((error) => {
				if (onError) {
					onError(error, parameterValues);
				}
			})
			.finally(() => {
				// reset source data to avoid multiple calls
				setParameterValueSourcesData(undefined);
				// set the requestingExport false to remove the loading icon
				setRequestingExport(false);
			});
	}, [parameterValueSourcesResults, exportRequest, onSuccess, onError]);

	// callback for when the export button has been clicked
	const onClick = useCallback(
		async (skipStargate?: boolean, customValues?: IParameterValues) => {
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

							// while we could let the useResolveParameterValues hook handle all parameters
							// we only want to pass those with sources to it
							// as otherwise we would have to filter the results again later
							return {
								value: p.source,
								id: p.parameter.name,
								namespace: p.parameter.sessionId,
							};
						}
					})
					.filter((p) => p !== undefined);

				setParameterValueSourcesData({
					data: {
						namespace: props.namespace,
						parameterValues: sources,
					},
					information,
				});
				return;
			} else {
				const pValues =
					customValues ||
					parameterValues?.reduce((acc, p) => {
						if (p.value) acc[p.parameter.name] = p.value;
						return acc;
					}, {} as IParameterValues);
				try {
					await exportRequest(skipStargate, pValues);
					// Call onSuccess if provided
					if (onSuccess) {
						onSuccess(pValues);
					}
				} catch (error) {
					if (onError) {
						onError(error, pValues);
					}
					throw error;
				} finally {
					// set the requestingExport false to remove the loading icon
					setRequestingExport(false);
				}
			}
		},
		[exportRequest, parameterValues, onSuccess, onError],
	);

	const onClickIntercepted = useCallback(
		(skipStargate?: boolean) => {
			return (event: React.MouseEvent) => {
				const cb = async (values?: IParameterValues) => {
					return interceptClick
						? interceptClick(() => onClick(skipStargate, values))
						: onClick(skipStargate, values);
				};
				return form ? form.onSubmit(cb)(event as any) : cb();
			};
		},
		[onClick, interceptClick, form],
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
						onClick={onClickIntercepted()}
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
