/**
 * Type declaration for the error reporting context.
 */
export interface IErrorReportingContext {
	/**
	 * Capture an exception and return the event id.
	 * @param exception
	 */
	captureException(exception: any): string;

	/**
	 * Capture a message and return the event id.
	 * @param message
	 */
	captureMessage(message: string): string;
}
