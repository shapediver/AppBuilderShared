/**
 * devtools settings for zustand
 * @see https://github.com/pmndrs/zustand#redux-devtools
 */
const reduxDevtoolsExtension =
	typeof window !== "undefined" &&
	(window as unknown as {__REDUX_DEVTOOLS_EXTENSION__?: unknown})
		.__REDUX_DEVTOOLS_EXTENSION__;

export const devtoolsSettings = {
	/** Avoid console spam when the Redux DevTools browser extension is not installed. */
	enabled: Boolean(reduxDevtoolsExtension),
};
