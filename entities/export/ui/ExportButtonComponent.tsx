import {
	IParameterValues,
	PropsExportWithForm,
} from "@AppBuilderLib/entities/export/config/propsExport";
import {useExecuteExport} from "@AppBuilderLib/entities/export/model/useExecuteExport";
import {useExport} from "@AppBuilderLib/entities/export/model/useExport";
import {
	ParameterValueDefinition,
	useResolveParameterValues,
} from "@AppBuilderLib/entities/parameter/model/useResolveParameterValues";
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
import {IAppBuilderActionPropsSetParameterValue} from "@AppBuilderLib/features/appbuilder/config/appbuilder";
import {useNotificationStore} from "@AppBuilderLib/features/notifications/model/useNotificationStore";
import {IProcessDefinition} from "@AppBuilderLib/shared/config/shapediverStoreProcessManager";
import {ExportInterceptorContext} from "@AppBuilderLib/shared/lib/ExportInterceptorContext";
import type {MantineButtonProps} from "@AppBuilderLib/shared/mantine-props/button";
import type {MantineTooltipProps} from "@AppBuilderLib/shared/mantine-props/tooltip";
import {useShapeDiverStoreProcessManager} from "@AppBuilderLib/shared/model/useShapeDiverStoreProcessManager";
import Icon from "@AppBuilderLib/shared/ui/icon/Icon";
import TooltipWrapper from "@AppBuilderLib/shared/ui/tooltip/TooltipWrapper";
import {Button, Group, MantineThemeComponent, useProps} from "@mantine/core";
import {EXPORT_TYPE} from "@shapediver/viewer.session";
import {
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import ExportLabelComponent from "./ExportLabelComponent";

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

/**
 * @docAttached
 * @category entity
 * @configPath themeOverrides.components.ExportButtonComponent.defaultProps
 * @displayName ExportButtonComponent
 */
export interface ExportButtonComponentStyleProps {
	/** Mantine Button props for the main export action */
	buttonProps?: MantineButtonProps;
	/** Tooltip wrapping the download button when applicable */
	downloadTooltipProps?: MantineTooltipProps;
	/** Mantine Button props for the download control */
	downloadButtonProps?: MantineButtonProps;
	/** When provided, hides the label header and uses this text as the button label. */
	buttonLabel?: string;
}

const defaultStyleProps: Partial<ExportButtonComponentStyleProps> = {
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

type ExportButtonComponentThemePropsType =
	Partial<ExportButtonComponentStyleProps>;
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
		buttonLabel,
		parameterValues,
		...rest
	} = useProps("ExportButtonComponent", defaultStyleProps, props);

	const {stargateColorProps} = useProps(
		"StargateShared",
		DefaultStargateStyleProps,
		rest,
	);

	const exportData = useExport(props);
	const {definition, actions} = exportData ?? {};
	const notifications = useNotificationStore();

	const {addProcess, createProcessManager} =
		useShapeDiverStoreProcessManager();

	const resolveMainPromiseRef = useRef<(() => void) | undefined>(undefined);

	if (!definition || !actions) {
		notifications.error({
			message: `Export ${props.exportId} not found`,
		});
		return null;
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

	const exportRequest = useExecuteExport(exportData, {
		isStargate,
		isContentSupported,
		onExportFile,
	});

	const [requestingExport, setRequestingExport] = useState(false);

	const [parameterValueSourcesData, setParameterValueSourcesData] = useState<
		| {
				data: {
					namespace: string;
					parameterValues: ParameterValueDefinition[];
				};
				information: {
					skipStargate?: boolean;
					parameterValues: IAppBuilderActionPropsSetParameterValue[];
				};
		  }
		| undefined
	>(undefined);

	const {values: parameterValueSourcesResults} = useResolveParameterValues(
		parameterValueSourcesData?.data,
	);

	useEffect(() => {
		if (!parameterValueSourcesData || !parameterValueSourcesResults) return;

		const parameterValues: {[key: string]: string} = {};
		let sourceIndex = 0;
		for (const p of parameterValueSourcesData.information.parameterValues) {
			if (p.value) {
				parameterValues[p.parameter.name] = p.value;
			} else if (p.source) {
				const sourceResult =
					parameterValueSourcesResults[sourceIndex++];
				if (sourceResult && typeof sourceResult === "string") {
					parameterValues[p.parameter.name] = sourceResult;
				}
			}
		}

		// request the export
		exportRequest({
			skipStargate: parameterValueSourcesData.information.skipStargate,
			parameterValues,
		})
			.then((result) => {
				// Call onSuccess if provided
				if (result && onSuccess) {
					onSuccess(parameterValues);
				}

				if (!result && onError) {
					onError(parameterValues);
				}
			})
			.finally(() => {
				// reset source data to avoid multiple calls
				setParameterValueSourcesData(undefined);
				// set the requestingExport false to remove the loading icon
				setRequestingExport(false);
				// resolve the main promise of the process manager to indicate that the process is finished
				if (resolveMainPromiseRef.current) {
					resolveMainPromiseRef.current();
					resolveMainPromiseRef.current = undefined;
				}
			});
	}, [
		parameterValueSourcesResults,
		exportRequest,
		resolveMainPromiseRef,
		onSuccess,
		onError,
	]);

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
					skipStargate?: boolean;
					parameterValues: IAppBuilderActionPropsSetParameterValue[];
				} = {
					skipStargate,
					parameterValues: parameterValues!,
				};

				const sources = parameterValues!
					.map((p) => {
						if (p.source) {
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

				// create a promise to wait for all sources to be resolved before requesting the export
				const mainPromise = new Promise<void>((resolve) => {
					resolveMainPromiseRef.current = resolve;
				});

				const mainProcessDefinition: IProcessDefinition = {
					name: "Export - Parameter Values Sources Process",
					promise: mainPromise,
				};

				// we have to await the sources, therefore we create a processManager
				const processManagerId = createProcessManager(props.namespace);
				addProcess(processManagerId, mainProcessDefinition);

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
					const result = await exportRequest({
						skipStargate,
						parameterValues: pValues,
					});
					// Call onSuccess if provided
					if (result && onSuccess) {
						onSuccess(pValues);
					}

					if (!result && onError) {
						onError(pValues);
					}
				} finally {
					// set the requestingExport false to remove the loading icon
					setRequestingExport(false);
				}
			}
		},
		[exportRequest, parameterValues, onSuccess, onError],
	);

	const onClickIntercepted = useCallback(
		(skipStargate?: boolean) => () => {
			const cb = (values?: IParameterValues) =>
				interceptClick
					? interceptClick(() => onClick(skipStargate, values))
					: onClick(skipStargate, values);
			return form ? form.onSubmit(cb)() : cb();
		},
		[onClick, interceptClick, form],
	);

	const standardExportButton = definition ? (
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
			{buttonLabel ||
				(definition.type === EXPORT_TYPE.DOWNLOAD
					? "Download File"
					: "Send Email")}
		</Button>
	) : null;

	const standardExportButtonWithTooltip =
		standardExportButton && definition?.tooltip ? (
			<TooltipWrapper label={definition.tooltip} position="top">
				{standardExportButton}
			</TooltipWrapper>
		) : (
			standardExportButton
		);

	return (
		<>
			{!buttonLabel && (
				<ExportLabelComponent
					{...props}
					label={label}
					rightSection={rightSection}
				/>
			)}
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
							onClick={onClickIntercepted()}
						/>
						<TooltipWrapper
							{...downloadTooltipProps}
							label={
								downloadTooltipProps?.label || "Download file"
							}
						>
							<Button
								{...downloadButtonProps}
								onClick={onClickIntercepted(true)}
								loading={requestingExport}
							>
								<Icon iconType={"tabler:download"} />
							</Button>
						</TooltipWrapper>
					</Group>
				) : (
					standardExportButtonWithTooltip
				))}
		</>
	);
}
