import ExportLabelComponent from "@AppBuilderShared/components/shapediver/exports/ExportLabelComponent";
import Icon from "@AppBuilderShared/components/ui/Icon";
import {NotificationContext} from "@AppBuilderShared/context/NotificationContext";
import {useExport} from "@AppBuilderShared/hooks/shapediver/parameters/useExport";
import {PropsExport} from "@AppBuilderShared/types/components/shapediver/propsExport";
import {IconTypeEnum} from "@AppBuilderShared/types/shapediver/icons";
import {Button} from "@mantine/core";
import {EXPORT_TYPE} from "@shapediver/viewer.session";
import {fetchFileWithToken} from "@shapediver/viewer.utils.mime-type";
import React, {useCallback, useContext, useState} from "react";

/**
 * Functional component that creates a button that triggers an export.
 * If the export is downloadable, that file will be downloaded.
 *
 * @returns
 */
export default function ExportButtonComponent(props: PropsExport) {
	const {definition, actions} = useExport(props);

	const notifications = useContext(NotificationContext);

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
				const url = content.href;
				const filename = `${response.filename}.${content.format}`;
				const sizemsg = content.size
					? ` (${Math.ceil(content.size / 1000)}kB)`
					: "";
				notifications.success({
					message: `Downloading file ${filename}${sizemsg}`,
				});
				const res = await actions.fetch(url);
				await fetchFileWithToken(res, filename);
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
	}, [actions, definition.type]);

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
			<ExportLabelComponent {...props} />
			{definition && (
				<>
					<Button
						variant="filled"
						fullWidth={true}
						leftSection={
							definition.type === EXPORT_TYPE.DOWNLOAD ? (
								<Icon type={IconTypeEnum.Download} />
							) : (
								<Icon type={IconTypeEnum.MailFoward} />
							)
						}
						onClick={onClick}
						loading={requestingExport}
					>
						{definition.type === EXPORT_TYPE.DOWNLOAD
							? "Download File"
							: "Send Email"}
					</Button>
				</>
			)}
		</>
	);
}
