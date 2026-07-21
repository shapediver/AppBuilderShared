import {IShapeDiverExport} from "@AppBuilderLib/entities/export/config/export";
import {useNotificationStore} from "@AppBuilderLib/features/notifications/model/useNotificationStore";
import {ErrorReportingContext} from "@AppBuilderLib/shared/lib/ErrorReportingContext";
import {EXPORT_TYPE} from "@shapediver/viewer.session";
import {fetchFileWithToken} from "@shapediver/viewer.utils.mime-type";
import {useCallback, useContext} from "react";

type ExecutableExport = Pick<IShapeDiverExport, "definition" | "actions">;

type ExecuteExportParams = {
	skipStargate?: boolean;
	parameterValues?: {[key: string]: string};
};

type UseExecuteExportOptions = {
	isStargate?: boolean;
	isContentSupported?: (content: any) => Promise<boolean>;
	onExportFile?: () => Promise<void> | void;
};

/**
 * Tiny shared hook for executing an export request and handling the common
 * download/email response flow. Presentation-specific loading state stays in
 * the caller.
 */
export function useExecuteExport(
	exportData: ExecutableExport | undefined,
	options: UseExecuteExportOptions = {},
) {
	const notifications = useNotificationStore();
	const errorReporting = useContext(ErrorReportingContext);
	const {isStargate = false, isContentSupported, onExportFile} = options;

	return useCallback(
		async ({skipStargate, parameterValues}: ExecuteExportParams = {}) => {
			if (!exportData) return false;

			const {definition, actions} = exportData;
			const response = await actions.request(parameterValues);

			if (definition.type === EXPORT_TYPE.DOWNLOAD) {
				if (response.content?.[0]?.href) {
					const content = response.content[0];
					if (!skipStargate && isStargate && isContentSupported && onExportFile) {
						if (!(await isContentSupported(content))) {
							notifications.error({
								title: "Unsupported content type",
								message: `Content type ${content.format} not supported by the selected client.`,
							});
							return false;
						}
						await onExportFile();
						return true;
					}

					const baseFilename = response.filename || definition.name || definition.id;
					const filename = baseFilename.endsWith(content.format)
						? baseFilename
						: `${baseFilename}.${content.format}`;
					const sizemsg = content.size
						? ` (${Math.ceil(content.size / 1000)}kB)`
						: "";
					notifications.success({
						message: `Downloading file ${filename}${sizemsg}`,
					});
					const res = await actions.fetch(content.href);
					await fetchFileWithToken(res, filename);
					return true;
				}

				if (response.content?.length === 0 && response.msg) {
					notifications.success({message: response.msg});
					return true;
				}

				const errorMessage = "Unexpected response for export of type download";
				notifications.error({message: errorMessage});
				errorReporting.captureException({
					message: errorMessage,
					exportResponse: response,
					exportDefinition: {
						id: definition.id,
						name: definition.name,
						type: definition.type,
					},
				});
				return false;
			}

			if (definition.type === EXPORT_TYPE.EMAIL) {
				if (response.result) {
					const result = response.result;
					if (result.err) {
						notifications.error({message: result.err});
						return false;
					}
					if (result.msg) {
						notifications.success({message: result.msg});
						return true;
					}
				}

				const errorMessage = "Unexpected response for export of type email";
				notifications.error({message: errorMessage});
				errorReporting.captureException({
					message: errorMessage,
					exportResponse: response,
					exportDefinition: {
						id: definition.id,
						name: definition.name,
						type: definition.type,
					},
				});
				return false;
			}

			const errorMessage = `Unexpected export type: ${definition.type}`;
			notifications.error({message: errorMessage});
			errorReporting.captureMessage(errorMessage);
			return false;
		},
		[
			exportData,
			isContentSupported,
			isStargate,
			notifications,
			onExportFile,
			errorReporting,
		],
	);
}
