import {
	AppBuilderNotificationData,
	INotificationContext,
	NotificationStyleProps,
} from "@AppBuilderShared/types/context/notificationcontext";
import {notifications} from "@mantine/notifications";
import {createContext} from "react";

export function createNotificationsWithDefaults(
	props: NotificationStyleProps = {},
): INotificationContext {
	const {show, hide, update} = notifications;
	const {
		autoClose,
		successColor,
		warningColor = "yellow",
		errorColor = "red",
	} = props;

	return {
		show,
		hide,
		update,
		error: (data: AppBuilderNotificationData) =>
			show({autoClose, color: errorColor, ...data}),
		warning: (data: AppBuilderNotificationData) =>
			show({autoClose, color: warningColor, ...data}),
		success: (data: AppBuilderNotificationData) =>
			show({autoClose, color: successColor, ...data}),
	};
}

/** Information about a template. */
export const NotificationContext = createContext<INotificationContext>(
	createNotificationsWithDefaults(),
);
