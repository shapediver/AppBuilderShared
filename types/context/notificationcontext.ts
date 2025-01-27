import {NotificationData} from "@mantine/notifications";

/**
 *
 */
export type AppBuilderNotificationData = Pick<
	NotificationData,
	| "id"
	| "position"
	| "message"
	| "autoClose"
	| "onClose"
	| "onOpen"
	| "title"
	| "icon"
	| "children"
	| "loading"
	| "withCloseButton"
>;

export interface NotificationStyleProps {
	/**
	 * Optional color to use for success notifications.
	 */
	successColor?: string;
	/**
	 * Optional color to use for warning notifications.
	 */
	warningColor?: string;
	/**
	 * Optional color to use for error notifications.
	 */
	errorColor?: string;
	/**
	 * Determines whether notification should be closed automatically,
	 * number is auto close timeout in ms.
	 * */
	autoClose?: boolean | number;
}

/**
 * Type declaration for the notification context.
 * This could be abstracted from mantine if necessary.
 */
export interface INotificationContext {
	/**
	 * Show a generic notification
	 * @param notification
	 * @returns id of notification
	 */
	show: (notification: AppBuilderNotificationData) => string;
	/**
	 * Hide a notification
	 * @param id
	 * @returns
	 */
	hide: (id: string) => string;
	/**
	 * Update a notification
	 * @param notification
	 * @returns
	 */
	update: (notification: AppBuilderNotificationData) => string | undefined;
	/**
	 * Show an error notification
	 * @param message
	 * @returns
	 */
	error: (notification: AppBuilderNotificationData) => string;
	/**
	 * Show a warning notification
	 * @param message
	 * @returns
	 */
	warning: (notification: AppBuilderNotificationData) => string;
	/**
	 * Show a success notification
	 * @param message
	 * @returns
	 */
	success: (notification: AppBuilderNotificationData) => string;
}
