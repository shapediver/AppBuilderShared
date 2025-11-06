import {GlobalNotificationContext} from "@AppBuilderShared/context/NotificationContext";
import {QUERYPARAM_LOGGING_LEVEL} from "@AppBuilderShared/types/shapediver/queryparams";

const urlSearchParams = new URLSearchParams(window.location.search);
const loggingLevelInput = urlSearchParams.get(QUERYPARAM_LOGGING_LEVEL);

type LoggingLevel = "debug" | "info" | "warn";

// determine logging level from URL parameter
// default to "warn" if not set or invalid
const loggingLevel: LoggingLevel = ["debug", "info", "warn"].includes(
	loggingLevelInput ?? "",
)
	? (loggingLevelInput as LoggingLevel)
	: "warn";

// Helper function to add timestamp and level prefix
const formatMessage = (level: string, message?: any) => {
	const timestamp = new Date().toISOString();
	return `[${timestamp}] [${level.toUpperCase()}] ${message}`;
};

/**
 * Logger utility with different logging levels.
 *
 * - debug:
 *     - debug messages are shown via console.debug
 *     - info messages are shown via console.info
 *     - warn messages are shown via console.warn and a notification
 * - info:
 *     - info messages are shown via console.info
 *     - warn messages are shown via console.warn
 * - warn:
 *     - warn messages are shown via console.warn
 */
export const Logger = {
	debug: (message?: any, ...optionalParams: any[]) => {
		if (loggingLevel === "debug") {
			console.debug(formatMessage("debug", message), ...optionalParams);
		}
	},
	info: (message?: any, ...optionalParams: any[]) => {
		if (loggingLevel === "debug" || loggingLevel === "info") {
			console.info(formatMessage("info", message), ...optionalParams);
		}
	},
	warn: (message?: any, ...optionalParams: any[]) => {
		console.warn(formatMessage("warn", message), ...optionalParams);
		if (loggingLevel === "debug") {
			GlobalNotificationContext.error({
				message: String(message),
				// optionalParams aren't suitable for notifications
			});
		}
	},
	error: (message?: any, ...optionalParams: any[]) => {
		console.error(formatMessage("error", message), ...optionalParams);
		GlobalNotificationContext.error({
			message: String(message),
		});
	},
};
