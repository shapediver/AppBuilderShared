import {
	AppBuilderNotificationData,
	NotificationStyleProps,
} from "@AppBuilderLib/features/notifications/config/notificationcontext";

/**
 * Environment display mode for notifications.
 * Determines in which context the notification should be displayed.
 */
export enum NotificationDisplayMode {
	/** Display in all environments */
	ALL = "all",
	/** Display only when running in the platform */
	PLATFORM = "platform",
	/** Display only when running as iframe/embedded */
	IFRAME = "iframe",
	/** Do not display notifications */
	NONE = "none",
}

/**
 * Base interface for all custom notification data.
 * Each custom notification component should define its own specific interface
 * that extends this base by including a unique 'type' property.
 */
export interface ICustomNotificationData {
	/** Unique type identifier for the custom notification */
	type: string;
	/** Additional properties specific to each notification type */
	[key: string]: unknown;
}

/**
 * Extended notification data with display mode support.
 */
export interface INotificationDataExtended extends AppBuilderNotificationData {
	/** Display mode for the notification */
	displayMode?: NotificationDisplayMode;
	/** Color for the notification */
	color?: string;
}

/**
 * Input type for show method - either regular or custom notification.
 * Custom notifications are detected by the presence of "type" property with a string value.
 */
export type NotificationInput =
	| INotificationDataExtended
	| (INotificationDataExtended & ICustomNotificationData);

/**
 * Stored custom notification with metadata.
 */
export interface ICustomNotificationStored {
	/** Unique identifier for the notification */
	id: string;
	/** Notification data */
	data: ICustomNotificationData;
	/** Display mode for the notification */
	displayMode?: NotificationDisplayMode;
	/** Timestamp when notification was created */
	createdAt: number;
}

/**
 * Interface for the notification store actions.
 */
export interface INotificationStoreActions {
	/**
	 * Show a notification. If notification has a "type" property (string),
	 * it will be treated as a custom notification with custom rendering.
	 * @param notification Notification data (regular or custom)
	 * @returns id of notification
	 */
	show: (notification: NotificationInput) => string | undefined;

	/**
	 * Hide a notification (both regular and custom).
	 * @param id Notification id
	 */
	hide: (id: string) => void;

	/**
	 * Update an existing notification.
	 * @param notification Notification data with id
	 */
	update: (notification: NotificationInput & {id: string}) => void;

	/**
	 * Show an error notification.
	 * @param notification Notification data
	 * @returns id of notification
	 */
	error: (notification: NotificationInput) => string | undefined;

	/**
	 * Show a warning notification.
	 * @param notification Notification data
	 * @returns id of notification
	 */
	warning: (notification: NotificationInput) => string | undefined;

	/**
	 * Show a success notification.
	 * @param notification Notification data
	 * @returns id of notification
	 */
	success: (notification: NotificationInput) => string | undefined;

	/**
	 * Update style properties for notifications.
	 * @param props Style properties
	 */
	setStyleProps: (props: Partial<NotificationStyleProps>) => void;
}

/**
 * Interface for the notification store state.
 */
export interface INotificationStoreState {
	/** Style properties for notifications */
	styleProps: NotificationStyleProps;
	/** Active custom notifications (for custom rendering) */
	customNotifications: ICustomNotificationStored[];
}

/**
 * Complete interface for the notification store.
 */
export interface IShapeDiverStoreNotifications
	extends INotificationStoreState,
		INotificationStoreActions {}

/**
 * Type guard to check if notification is a custom notification.
 * A notification is considered custom if it has a "type" property with a string value.
 */
export function isCustomNotification(
	notification: NotificationInput,
): notification is INotificationDataExtended & ICustomNotificationData {
	return "type" in notification;
}
