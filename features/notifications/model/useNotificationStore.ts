import {NotificationStyleProps} from "@AppBuilderLib/features/notifications/config/notificationcontext";
import {
	ICustomNotificationData,
	ICustomNotificationStored,
	INotificationDataExtended,
	isCustomNotification,
	IShapeDiverStoreNotifications,
	NotificationDisplayMode,
	NotificationInput,
} from "@AppBuilderLib/features/notifications/config/shapediverStoreNotifications";
import {devtoolsSettings} from "@AppBuilderLib/shared/config/storeSettings";
import {
	getEnvironmentIdentifier,
	isRunningInPlatform,
} from "@AppBuilderLib/shared/lib/platform";
import {notifications} from "@mantine/notifications";
import {create} from "zustand";
import {devtools} from "zustand/middleware";

const defaultStyleProps: NotificationStyleProps = {
	errorColor: "red",
	warningColor: "yellow",
	successColor: undefined,
	autoClose: 20000,
};

/**
 * Generate a unique notification ID.
 */
function generateNotificationId(): string {
	return `notification-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Check if notification should be displayed based on current environment.
 */
function shouldDisplayNotification(
	displayMode?: NotificationDisplayMode,
): boolean {
	if (!displayMode || displayMode === NotificationDisplayMode.ALL) {
		return true;
	}

	if (displayMode === NotificationDisplayMode.NONE) {
		return false;
	}

	const envIdentifier = getEnvironmentIdentifier();
	const inPlatform = isRunningInPlatform();

	if (displayMode === NotificationDisplayMode.PLATFORM) {
		return inPlatform;
	}

	if (displayMode === NotificationDisplayMode.IFRAME) {
		return envIdentifier === "iframe";
	}

	return !!displayMode;
}

/**
 * Notification store for managing application notifications.
 * Supports both regular Mantine notifications and custom notifications with custom rendering.
 */
export const useNotificationStore = create<IShapeDiverStoreNotifications>()(
	devtools(
		(set, get) => ({
			styleProps: defaultStyleProps,
			customNotifications: [],

			show: (notification: NotificationInput): string | undefined => {
				const {styleProps} = get();
				const {displayMode, ...rest} = notification;

				// Check if notification should be displayed in current environment
				if (!shouldDisplayNotification(displayMode)) {
					return undefined;
				}

				const id = notification.id || generateNotificationId();

				// Check if this is a custom notification
				if (isCustomNotification(notification)) {
					const {type, ...customData} = notification;
					const customNotification: ICustomNotificationStored = {
						id,
						data: {type, ...customData} as ICustomNotificationData,
						displayMode,
						createdAt: Date.now(),
					};

					set(
						(state) => ({
							customNotifications: [
								...state.customNotifications,
								customNotification,
							],
						}),
						false,
						"show (custom)",
					);
				}

				// Regular notification
				notifications.show({
					id,
					autoClose: styleProps.autoClose,
					...rest,
				});

				return id;
			},

			hide: (id: string): void => {
				// Hide from Mantine notifications
				notifications.hide(id);

				// Remove from custom notifications if present
				set(
					(state) => ({
						customNotifications: state.customNotifications.filter(
							(n) => n.id !== id,
						),
					}),
					false,
					"hide",
				);
			},

			update: (notification): void => {
				const {displayMode, ...rest} = notification;

				// Check if notification should be displayed in current environment
				if (!shouldDisplayNotification(displayMode)) {
					return undefined;
				}

				notifications.update(rest);
			},

			error: (
				notification: INotificationDataExtended,
			): string | undefined => {
				const {styleProps, show} = get();
				return show({
					...notification,
					color: styleProps.errorColor,
				});
			},

			warning: (
				notification: INotificationDataExtended,
			): string | undefined => {
				const {styleProps, show} = get();
				return show({
					...notification,
					color: styleProps.warningColor,
				});
			},

			success: (
				notification: INotificationDataExtended,
			): string | undefined => {
				const {styleProps, show} = get();
				return show({
					...notification,
					color: styleProps.successColor,
				});
			},

			setStyleProps: (props: Partial<NotificationStyleProps>): void => {
				set(
					(state) => ({
						styleProps: {
							...state.styleProps,
							...props,
						},
					}),
					false,
					"setStyleProps",
				);
			},
		}),
		{...devtoolsSettings, name: "ShapeDiver | Notifications"},
	),
);

/**
 * Get notification store actions without subscribing to state changes.
 * Useful for calling from non-React code or callbacks.
 */
export const getNotificationActions = () => {
	const {show, hide, update, error, warning, success, setStyleProps} =
		useNotificationStore.getState();
	return {show, hide, update, error, warning, success, setStyleProps};
};
