import {NotificationData} from "@mantine/notifications";
import {z} from "zod";

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

/** Theme `defaultProps` for `useProps("NotificationWrapper", …)` — single source with `NotificationStyleProps`. */
export const NotificationWrapperThemeDefaultPropsSchema = z.strictObject({
	successColor: z.string().optional(),
	warningColor: z.string().optional(),
	errorColor: z.string().optional(),
	autoClose: z.union([z.boolean(), z.number()]).optional(),
});

/**
 * Global notification styling driven by theme (`NotificationWrapper`).
 *
 * @docAttached
 * @category feature
 * @configPath themeOverrides.components.NotificationWrapper.defaultProps
 * @displayName NotificationWrapper
 */
export interface NotificationStyleProps
	extends z.infer<typeof NotificationWrapperThemeDefaultPropsSchema> {
	/** Optional color to use for success notifications. */
	successColor?: string;
	/**
	 * Optional color to use for warning notifications.
	 * @default "yellow"
	 */
	warningColor?: string;
	/**
	 * Optional color to use for error notifications.
	 * @default "red"
	 */
	errorColor?: string;
	/**
	 * Determines whether notification should be closed automatically,
	 * number is auto close timeout in ms.
	 *
	 * @default 20000
	 */
	autoClose?: boolean | number;
}

export enum NotificationAction {
	SUCCESS = "success",
	WARNING = "warning",
	ERROR = "error",
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
	[NotificationAction.ERROR]: (
		notification: AppBuilderNotificationData,
	) => string;
	/**
	 * Show a warning notification
	 * @param message
	 * @returns
	 */
	[NotificationAction.WARNING]: (
		notification: AppBuilderNotificationData,
	) => string;
	/**
	 * Show a success notification
	 * @param message
	 * @returns
	 */
	[NotificationAction.SUCCESS]: (
		notification: AppBuilderNotificationData,
	) => string;
}
