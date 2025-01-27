const PROD_PLATFORM_HOST = "shapediver.com";
const STAGING_PLATFORM_HOST = "staging-wwwcdn.us-east-1.shapediver.com";
const DEV_PLATFORM_HOST = "dev-wwwcdn.us-east-1.shapediver.com";
const SANDBOX_PLATFORM_HOST = "sandbox-wwwcdn.us-east-1.shapediver.com";

const urlSearchParams = new URLSearchParams(window.location.search);
const useSandboxPlatform = urlSearchParams.get("useSandboxPlatform") === "true";
const useStagingPlatform = urlSearchParams.get("useStagingPlatform") === "true";
const useDevPlatform = urlSearchParams.get("useDevPlatform") === "true";

/**
 * Get the default platform URL based on the current hostname.
 * @returns
 */
export function getDefaultPlatformUrl() {
	if (shouldUsePlatform()) {
		if (getEnvironmentIdentifier() === "localhost") {
			if (useSandboxPlatform) return `https://${SANDBOX_PLATFORM_HOST}`;
			if (useStagingPlatform) return `https://${STAGING_PLATFORM_HOST}`;
			if (useDevPlatform) return `https://${DEV_PLATFORM_HOST}`;
		}

		return origin;
	}

	return `https://${PROD_PLATFORM_HOST}`;
}

/**
 * Test whether the application should behave like it is running in the ShapeDiver platform.
 * This is the case if it is running on localhost and one of the query parameters `useDevPlatform`,
 * `useStagingPlatform` or `useSandboxPlatform` is set to `true`,
 * or if it is actually running on the ShapeDiver platform.
 */
export function shouldUsePlatform() {
	if (getEnvironmentIdentifier() === "localhost") {
		if (useSandboxPlatform || useStagingPlatform || useDevPlatform)
			return true;
	}

	return isRunningInPlatform();
}

/**
 * Test whether the application is running embedded in the ShapeDiver platform.
 */
export function isRunningInPlatform() {
	const hostname = window.location.hostname;
	if (
		hostname === STAGING_PLATFORM_HOST ||
		hostname === "staging-spa.us-east-1.shapediver.com"
	)
		return true;
	else if (
		hostname === DEV_PLATFORM_HOST ||
		hostname === "dev-spa.us-east-1.shapediver.com"
	)
		return true;
	else if (
		hostname === SANDBOX_PLATFORM_HOST ||
		hostname === "sandbox-spa.us-east-1.shapediver.com"
	)
		return true;
	else if (
		hostname === PROD_PLATFORM_HOST ||
		hostname === "www.shapediver.com"
	)
		return true;

	return false;
}

/**
 * Get an identifier for the environment depending on the current hostname.
 */
export function getEnvironmentIdentifier() {
	const hostname = window.location.hostname;
	if (hostname === "localhost" || hostname === "127.0.0.1")
		return "localhost";
	else if (
		hostname === STAGING_PLATFORM_HOST ||
		hostname === "staging-spa.us-east-1.shapediver.com"
	)
		return "staging";
	else if (
		hostname === DEV_PLATFORM_HOST ||
		hostname === "dev-spa.us-east-1.shapediver.com"
	)
		return "development";
	else if (
		hostname === SANDBOX_PLATFORM_HOST ||
		hostname === "sandbox-spa.us-east-1.shapediver.com"
	)
		return "sandbox";
	else if (
		hostname === PROD_PLATFORM_HOST ||
		hostname === "www.shapediver.com"
	)
		return "production";
	else if (hostname === "appbuilder.shapediver.com") return "iframe";

	return "unknown";
}

/**
 * Get the client ID for the platform.
 * @returns
 */
export function getPlatformClientId() {
	return "920794fa-245a-487d-8abe-af569a97da42";
}
