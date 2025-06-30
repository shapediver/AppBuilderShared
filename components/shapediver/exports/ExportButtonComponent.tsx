import ExportLabelComponent from "@AppBuilderShared/components/shapediver/exports/ExportLabelComponent";
import Icon from "@AppBuilderShared/components/ui/Icon";
import {NotificationContext} from "@AppBuilderShared/context/NotificationContext";
import {useExport} from "@AppBuilderShared/hooks/shapediver/parameters/useExport";
import {
	ExportStatusEnum,
	useStargateExport,
} from "@AppBuilderShared/hooks/shapediver/stargate/useStargateExport";
import {PropsExport} from "@AppBuilderShared/types/components/shapediver/propsExport";
import {IconTypeEnum} from "@AppBuilderShared/types/shapediver/icons";
import {StargateFileParamPrefix} from "@AppBuilderShared/types/shapediver/stargate";
import {
	Button,
	ButtonProps,
	MantineThemeComponent,
	useProps,
} from "@mantine/core";
import {EXPORT_TYPE} from "@shapediver/viewer.session";
import {fetchFileWithToken} from "@shapediver/viewer.utils.mime-type";
import React, {useCallback, useContext, useMemo, useState} from "react";
import StargateInput from "../stargate/StargateInput";

/** Type for data related to the status of the component. */
type IStatusData = {
	color: string;
	message: string;
	isBtnDisabled: boolean;
};

/**
 * Map from status enum to status data.
 */
const StatusDataMap: {[key in ExportStatusEnum]: IStatusData} = {
	[ExportStatusEnum.notActive]: {
		color: "var(--mantine-color-gray-2)",
		message: "No active client found",
		isBtnDisabled: true,
	},
	[ExportStatusEnum.incompatible]: {
		color: "var(--mantine-color-gray-2)",
		message: "Incompatible export",
		isBtnDisabled: true,
	},
	[ExportStatusEnum.active]: {
		color: "orange",
		message: "Export is available",
		isBtnDisabled: false,
	},
};

interface StyleProps {
	buttonProps?: Partial<ButtonProps>;
}

const defaultStyleProps: Partial<StyleProps> = {
	buttonProps: {
		variant: "filled",
		fullWidth: true,
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
	props: PropsExport & ExportButtonComponentThemePropsType,
) {
	const {buttonProps} = useProps(
		"ExportButtonComponent",
		defaultStyleProps,
		props,
	);

	const {definition, actions} = useExport(props);

	const notifications = useContext(NotificationContext);

	// Use stargate output hook for this specific chunk
	const {isWaiting, isContentSupported, status, onExportFile} =
		useStargateExport({
			exportId: definition.id,
			contentIndex: 0,
			sessionId: props.namespace,
		});

	const statusData = useMemo(() => {
		return StatusDataMap[status];
	}, [status]);

	// Criterion to determine if the export button shall use Stargate.
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

	const exportRequest = useCallback(async () => {
		// request the export
		const response = await actions.request();

		// if the export is a download export, download it
		if (definition.type === EXPORT_TYPE.DOWNLOAD) {
			if (
				response.content &&
				response.content[0] &&
				response.content[0].href
			) {
				const content = response.content[0];
				if (isStargate) {
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
					const filename = response.filename?.endsWith(content.format)
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
	}, [actions, definition.type, isStargate, isContentSupported]);

	const [requestingExport, setRequestingExport] = useState(false);

	// callback for when the export button has been clicked
	const onClick = useCallback(async () => {
		// set the requestingExport true to display a loading icon
		setRequestingExport(true);

		await exportRequest();

		// set the requestingExport false to remove the loading icon
		setRequestingExport(false);
	}, [exportRequest]);

	return (
		<>
			<ExportLabelComponent {...props} label={label} />
			{definition &&
				(isStargate ? (
					<StargateInput
						message={statusData.message}
						color={statusData.color}
						isWaiting={requestingExport || isWaiting}
						waitingText="Waiting for export..."
						isBtnDisabled={statusData.isBtnDisabled}
						onClick={onClick}
					/>
				) : (
					<Button
						leftSection={
							definition.type === EXPORT_TYPE.DOWNLOAD ? (
								<Icon type={IconTypeEnum.Download} />
							) : (
								<Icon type={IconTypeEnum.MailFoward} />
							)
						}
						onClick={onClick}
						loading={requestingExport}
						{...buttonProps}
					>
						{definition.type === EXPORT_TYPE.DOWNLOAD
							? "Download File"
							: "Send Email"}
					</Button>
				))}
		</>
	);
}
