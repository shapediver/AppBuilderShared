import {
	AppBuilderNotificationData,
	NotificationStyleProps,
} from "@AppBuilderShared/types/context/notificationcontext";

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
}

/**
 * Type of special notification.
 */
export enum SpecialNotificationType {
	MODEL_STATE_CREATED = "model_state_created",
}

/**
 * Special notification for model state created.
 */
export interface IModelStateCreatedNotificationData {
	type: SpecialNotificationType.MODEL_STATE_CREATED;
	/** The ID of the created model state */
	modelStateId: string;
	/** Link to the model state */
	link: string;
}

/**
 * Union type for all special notification data.
 */
export type SpecialNotificationData = IModelStateCreatedNotificationData;

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
 * Input type for show method - either regular or special notification.
 * Special notifications are detected by the presence of "type" property.
 */
export type NotificationInput =
	| INotificationDataExtended
	| (INotificationDataExtended & SpecialNotificationData);

/**
 * Stored special notification with metadata.
 */
export interface ISpecialNotificationStored {
	/** Unique identifier for the notification */
	id: string;
	/** Notification data */
	data: SpecialNotificationData;
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
	 * Show a notification. If notification has a "type" property from SpecialNotificationType,
	 * it will be treated as a special notification with custom rendering.
	 * @param notification Notification data (regular or special)
	 * @returns id of notification
	 */
	show: (notification: NotificationInput) => string;

	/**
	 * Hide a notification (both regular and special).
	 * @param id Notification id
	 */
	hide: (id: string) => void;

	/**
	 * Update an existing notification.
	 * @param notification Notification data with id
	 */
	update: (notification: INotificationDataExtended & {id: string}) => void;

	/**
	 * Show an error notification.
	 * @param notification Notification data
	 * @returns id of notification
	 */
	error: (notification: INotificationDataExtended) => string;

	/**
	 * Show a warning notification.
	 * @param notification Notification data
	 * @returns id of notification
	 */
	warning: (notification: INotificationDataExtended) => string;

	/**
	 * Show a success notification.
	 * @param notification Notification data
	 * @returns id of notification
	 */
	success: (notification: INotificationDataExtended) => string;

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
	/** Active special notifications (for custom rendering) */
	specialNotifications: ISpecialNotificationStored[];
}

/**
 * Complete interface for the notification store.
 */
export interface IShapeDiverStoreNotifications
	extends INotificationStoreState,
		INotificationStoreActions {}

/**
 * Type guard to check if notification is a special notification.
 */
export function isSpecialNotification(
	notification: NotificationInput,
): notification is INotificationDataExtended & SpecialNotificationData {
	return (
		"type" in notification &&
		Object.values(SpecialNotificationType).includes(
			notification.type as SpecialNotificationType,
		)
	);
}
