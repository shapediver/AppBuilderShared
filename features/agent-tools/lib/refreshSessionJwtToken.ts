import type {ISessionApi} from "@shapediver/viewer.session";

/**
 * Same refresh the viewer runs after `SdJwtValidationError`: call the session
 * callback, then store the token with `setJwtToken`.
 */
export async function refreshSessionJwtToken(
	sessionApi: ISessionApi | undefined,
): Promise<string> {
	const refresh = sessionApi?.refreshJwtToken;
	if (!sessionApi || !refresh) {
		throw new Error(
			"App Builder cannot refresh the JWT for this session.",
		);
	}
	const jwtToken = (await refresh()).trim();
	if (!jwtToken) {
		throw new Error("App Builder returned an empty JWT.");
	}
	await sessionApi.setJwtToken(jwtToken);
	return jwtToken;
}
