import Icon from "@AppBuilderShared/components/ui/Icon";
import {useNotificationStore} from "@AppBuilderShared/store/useNotificationStore";
import {Anchor} from "@mantine/core";
import React, {useCallback} from "react";

/**
 * Props for the NotificationModelStateCreated component.
 * External components can use this without the type discriminator.
 */
export interface INotificationModelStateCreatedProps {
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
export default function NotificationModelStateCreated({
	modelStateId,
	link,
}: INotificationModelStateCreatedProps) {
	const {success, warning} = useNotificationStore();

	const copyStateLink = useCallback(async () => {
		try {
			await navigator.clipboard.writeText(link);
			success({
				message: "State link copied to clipboard!",
			});
		} catch {
			/* clipboard write failed */
			warning({
				message: `State link could not be copied to clipboard, please copy it from here: ${link}`,
			});
		}
	}, [link, success, warning]);

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
