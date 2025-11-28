import {devtoolsSettings} from "@AppBuilderShared/store/storeSettings";
import {NotificationStyleProps} from "@AppBuilderShared/types/context/notificationcontext";
import {
	INotificationDataExtended,
	IShapeDiverStoreNotifications,
	ISpecialNotificationStored,
	isSpecialNotification,
	NotificationDisplayMode,
	NotificationInput,
	SpecialNotificationData,
} from "@AppBuilderShared/types/store/shapediverStoreNotifications";
import {
	getEnvironmentIdentifier,
	isRunningInPlatform,
} from "@AppBuilderShared/utils/platform/environment";
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
 * Supports both regular Mantine notifications and special notifications with custom rendering.
 */
export const useNotificationStore = create<IShapeDiverStoreNotifications>()(
	devtools(
		(set, get) => ({
			styleProps: defaultStyleProps,
			specialNotifications: [],

			show: (notification: NotificationInput): string => {
				const {styleProps} = get();
				const {displayMode, ...rest} = notification;

				// Check if notification should be displayed in current environment
				if (!shouldDisplayNotification(displayMode)) {
					return "";
				}

				const id = notification.id || generateNotificationId();

				// Check if this is a special notification
				if (isSpecialNotification(notification)) {
					const {type, ...specialData} = notification;
					const specialNotification: ISpecialNotificationStored = {
						id,
						data: {type, ...specialData} as SpecialNotificationData,
						displayMode,
						createdAt: Date.now(),
					};

					set(
						(state) => ({
							specialNotifications: [
								...state.specialNotifications,
								specialNotification,
							],
						}),
						false,
						"show (special)",
					);

					// Show Mantine notification for special notifications too
					// The message will be rendered by the special notification component
					notifications.show({
						id,
						autoClose: styleProps.autoClose,
						...rest,
					});

					return id;
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

				// Remove from special notifications if present
				set(
					(state) => ({
						specialNotifications: state.specialNotifications.filter(
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
					return;
				}

				notifications.update(rest);
			},

			error: (notification: INotificationDataExtended): string => {
				const {styleProps, show} = get();
				return show({
					...notification,
					color: styleProps.errorColor,
				});
			},

			warning: (notification: INotificationDataExtended): string => {
				const {styleProps, show} = get();
				return show({
					...notification,
					color: styleProps.warningColor,
				});
			},

			success: (notification: INotificationDataExtended): string => {
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
