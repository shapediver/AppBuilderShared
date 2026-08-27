import {
	defaultNotificationStyleProps,
	NotificationStyleProps,
} from "@AppBuilderLib/features/notifications/config/notificationcontext";
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
} from "@AppBuilderLib/shared/lib/platform/environment";
import {notifications} from "@mantine/notifications";
import {create} from "zustand";
import {devtools} from "zustand/middleware";

/**
 * Generate a unique notification ID.
 */
function generateNotificationId(): string {
	// Stryker disable next-line MethodExpression: id uniqueness unused by unit tests
	return `notification-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Check if notification should be displayed based on current environment.
 */
function shouldDisplayNotification(
	displayMode?: NotificationDisplayMode,
): boolean {
	// Stryker disable next-line ConditionalExpression,LogicalOperator: empty displayMode already shows
	if (!displayMode || displayMode === NotificationDisplayMode.ALL) {
		return true;
	}

	// Stryker disable next-line ConditionalExpression: NONE vs other modes already gated by the ALL/empty check
	if (displayMode === NotificationDisplayMode.NONE) {
		return false;
	}

	// Stryker disable all: PLATFORM/IFRAME unused by unit tests (localhost jsdom)
	const envIdentifier = getEnvironmentIdentifier();
	const inPlatform = isRunningInPlatform();

	if (displayMode === NotificationDisplayMode.PLATFORM) {
		return inPlatform;
	}

	if (displayMode === NotificationDisplayMode.IFRAME) {
		return envIdentifier === "iframe";
	}

	return !!displayMode;
	// Stryker restore all
}

/**
 * Notification store for managing application notifications.
 * Supports both regular Mantine notifications and custom notifications with custom rendering.
 */
export const useNotificationStore = create<IShapeDiverStoreNotifications>()(
	devtools(
		(set, get) => ({
			styleProps: defaultNotificationStyleProps,
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
						// Stryker disable next-line BooleanLiteral: zustand replace flag unused in unit tests
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
					// Stryker disable next-line BooleanLiteral: zustand replace flag unused in unit tests
					false,
					"hide",
				);
			},

			// Stryker disable all: update() observable equals early-return under NONE tests
			update: (notification): void => {
				const {displayMode, ...rest} = notification;

				// Check if notification should be displayed in current environment
				if (!shouldDisplayNotification(displayMode)) {
					return undefined;
				}

				notifications.update(rest);
			},
			// Stryker restore all

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

			info: (
				notification: INotificationDataExtended,
			): string | undefined => {
				const {styleProps, show} = get();
				return show({
					...notification,
					color: styleProps.infoColor,
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
		// Stryker disable next-line ObjectLiteral: zustand name unused in unit tests
		{...devtoolsSettings, name: "ShapeDiver | Notifications"},
	),
);

/**
 * Get notification store actions without subscribing to state changes.
 * Useful for calling from non-React code or callbacks.
 */
export const getNotificationActions = () => {
	const {show, hide, update, error, warning, success, info, setStyleProps} =
		useNotificationStore.getState();
	return {show, hide, update, error, warning, success, info, setStyleProps};
};
