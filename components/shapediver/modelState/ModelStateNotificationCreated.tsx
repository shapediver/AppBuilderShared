import Icon from "@AppBuilderShared/components/ui/Icon";
import { NotificationContext } from "@AppBuilderShared/context/NotificationContext";
import { Anchor } from "@mantine/core";
import React, { useCallback, useContext } from "react";

export interface IModelStateNotificationCreatedProps {
	modelStateId: string;
	link: string;
}

/**
 * Functional component for displaying a model state created notification.
 *
 * @param props - Component props
 * @param props.modelStateId - The ID of the created model state
 * @param props.link - Custom link to copy
 * @returns JSX element with notification content including copy state functionality
 */
export default function ModelStateNotificationCreated({
	modelStateId,
	link,
}: IModelStateNotificationCreatedProps) {
	const notifications = useContext(NotificationContext);

	const copyStateLink = useCallback(async () => {
		try {
			await navigator.clipboard.writeText(link);
			notifications.success({
				message: "State link copied to clipboard!",
			});
		} catch {
			/* clipboard write failed */
			notifications.warning({
				message: `State link could not be copied to clipboard, please copy it from here: ${link}`,
			});
		}
	}, [modelStateId, link, notifications]);

	return (
		<>
			Model state with ID {modelStateId} has been saved.
			<Anchor ml={4} size="sm" component="span" onClick={copyStateLink}>
				Copy state
				<Icon iconType={"tabler:copy"} size={14} />
			</Anchor>
		</>
	);
}
