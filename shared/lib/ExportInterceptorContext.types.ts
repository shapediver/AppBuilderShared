/**
 * Contextual information for intercepting export button
 * and Stargate output button clicks.
 */
export interface IExportInterceptorContext {
	/**
	 * Optional interceptor function to call instead of the export
	 * or output button click handler.
	 */
	interceptClick?: (onClick: () => void) => void;
	/**
	 * Optional component to render in the right section of the export
	 * or output button label.
	 */
	rightSection?: React.ReactNode;
}
