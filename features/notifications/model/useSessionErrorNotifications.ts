import {useNotificationStore} from "@AppBuilderLib/features/notifications/model/useNotificationStore";
import {ResErrorType, ResponseError} from "@shapediver/sdk.geometry-api-sdk-v2";
import {
	addListener,
	EventResponseMapping,
	EVENTTYPE_SESSION,
	removeListener,
} from "@shapediver/viewer.session";
import {useEffect} from "react";

/**
 * Hook that listens for viewer session error events and shows notifications
 * for relevant error types.
 *
 * Currently shows a notification for failed texture fetching (TEXTURE_URL_ERROR).
 */
export function useSessionErrorNotifications() {
	const {error} = useNotificationStore();

	useEffect(() => {
		const token = addListener(EVENTTYPE_SESSION.SESSION_ERROR, (e) => {
			const sessionEvent =
				e as EventResponseMapping[typeof EVENTTYPE_SESSION.SESSION_ERROR];
			const err = sessionEvent.error;

			if (
				err instanceof ResponseError &&
				err.type === ResErrorType.TEXTURE_URL_ERROR
			) {
				error({
					title: "Texture Loading Error",
					message: err.message,
				});
			}
		});

		return () => {
			removeListener(token);
		};
	}, [error]);
}
