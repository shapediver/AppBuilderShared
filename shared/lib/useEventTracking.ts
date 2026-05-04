import {useNotificationStore} from "@AppBuilderLib/features/notifications";
import {
	IEventTracking,
	IEventTrackingProps,
} from "@AppBuilderLib/shared/config";
import {
	ErrorReportingContext,
	Logger,
	roundToBracket,
	TrackerContext,
} from "@AppBuilderLib/shared/lib";
import {ResComputationStatus} from "@shapediver/sdk.geometry-api-sdk-v2";
import {isViewerCustomizationError} from "@shapediver/viewer.session";
import {useContext, useMemo} from "react";

/**
 * Hook for event tracking.
 * @returns
 */
export const useEventTracking = () => {
	const notifications = useNotificationStore();
	const tracker = useContext(TrackerContext);
	const errorReporting = useContext(ErrorReportingContext);

	const eventTracking = useMemo<IEventTracking>(() => {
		return {
			onError: (e: any, context?: IEventTrackingProps) => {
				const {namespace, duration, action} = context ?? {};
				if (isViewerCustomizationError(e)) {
					let _title = namespace
						? `Computation failed for session "${namespace}"`
						: "Computation failed";
					_title = duration
						? `${_title} after ${duration} ms`
						: _title;
					const status = Object.values(e.errorObject.outputs)
						.map((o) => o.status_computation)
						.concat(
							Object.values(e.errorObject.exports).map(
								(o) => o.status_computation,
							),
						)
						.concat(
							Object.values(e.errorObject.outputs).map(
								(o) => o.status_collect,
							),
						)
						.concat(
							Object.values(e.errorObject.exports).map(
								(o) => o.status_collect,
							),
						)
						.find((s) => s && s !== ResComputationStatus.SUCCESS);

					const messages = Object.values(e.errorObject.outputs)
						.map((o) => o.msg)
						.concat(
							Object.values(e.errorObject.exports).map(
								(o) => o.msg,
							),
						);
					const title = status ? `${_title} (${status})` : _title;
					Logger.warn(title, e);

					const message =
						e.message +
							"\n" +
							messages.filter((m) => m).join("\n") || e.message;

					notifications.error({title, message});
					tracker.trackEvent(`${action}_error`, {
						props: {
							namespace,
							duration: duration
								? roundToBracket(duration, 100)
								: undefined,
							status,
						},
					});
				} else {
					const _title = namespace
						? `Error while executing changes for session "${namespace}"`
						: "Error while executing changes";
					const title = duration
						? `${_title} after ${duration} ms`
						: _title;
					errorReporting.captureException(e);
					Logger.error(title, e);
					notifications.error({title, message: e.message});
					tracker.trackEvent(`${action}_error`, {
						props: {
							namespace,
							duration: duration
								? roundToBracket(duration, 100)
								: undefined,
						},
					});
				}
			},
			onSuccess: (context: IEventTrackingProps) => {
				const {namespace, duration, action} = context;
				tracker.trackEvent(`${action}_success`, {
					props: {
						namespace,
						duration: duration
							? roundToBracket(duration, 100)
							: undefined,
					},
				});
			},
		};
	}, []);

	return eventTracking;
};
