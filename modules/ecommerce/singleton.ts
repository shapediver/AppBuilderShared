import {
	DummyECommerceApi,
	ECommerceApiFactory,
} from "@AppBuilderShared/modules/ecommerce/ecommerceapi";
import {isRunningInPlatform} from "@AppBuilderShared/utils/platform/environment";

/** Number of key events for toggling configurator visibility. */
const TOGGLE_CONFIGURATOR_VISIBILITY_NUM_EVENTS = 3;
/** Time window in milliseconds for toggling configurator visibility. */
const TOGGLE_CONFIGURATOR_VISIBILITY_MSEC = 750;
/** Key for toggling configurator visibility. */
const TOGGLE_CONFIGURATOR_VISIBILITY_KEY = "Escape";
/** Timeout for establishing the cross-window API connection. */
const CROSSWINDOW_API_TIMEOUT = 20000;

export const ECommerceApiSingleton = (async () => {
	// if window.parent === window return a dummy api for testing
	if (isRunningInPlatform() || window.parent === window) {
		return new DummyECommerceApi();
	}

	const eCommerceApi = await ECommerceApiFactory.getApplicationApi(
		"app",
		"plugin",
		{timeout: CROSSWINDOW_API_TIMEOUT, debug: false},
	);
	console.log("Successfully resolved ECommerceApi", eCommerceApi);

	// event handler for toggling configurator visibility
	let toggleKeyPressCount = 0;
	let timer: ReturnType<typeof setTimeout>;

	document.addEventListener("keydown", (event) => {
		if (event.key === TOGGLE_CONFIGURATOR_VISIBILITY_KEY) {
			toggleKeyPressCount++;

			if (toggleKeyPressCount === 1) {
				// Start the timer on the first key press
				timer = setTimeout(() => {
					// Reset the counter if the time window expires
					toggleKeyPressCount = 0;
				}, TOGGLE_CONFIGURATOR_VISIBILITY_MSEC);
			}

			if (
				toggleKeyPressCount ===
				TOGGLE_CONFIGURATOR_VISIBILITY_NUM_EVENTS
			) {
				// If the key is pressed X times within Y milliseconds
				clearTimeout(timer); // Clear the timer to prevent reset
				eCommerceApi.closeConfigurator(); // Call the event handler
				toggleKeyPressCount = 0; // Reset the counter after the event is handled
			}
		}
	});

	return eCommerceApi;
})();
