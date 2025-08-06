/**
 * Definition for an interaction request in the ShapeDiver store.
 * This interface defines the structure of an interaction request,
 * including its type, viewport ID, and methods to enable or disable the interaction.
 *
 * type can be "active" or "passive"
 * - "active" means the interaction is an interaction that was requested by the user
 * - "passive" means the interaction is an interaction that was requested by the system
 */
export interface IInteractionRequest {
	/**
	 * The type of interaction request, either "active" or "passive".
	 */
	type: "active" | "passive";
	/**
	 * The ID of the viewport associated with this interaction request.
	 */
	viewportId: string;
	/**
	 * A function to disable the interaction request.
	 */
	disable: () => void;
}

export interface IActiveInteractionRequest extends IInteractionRequest {
	type: "active";
}

export interface IPassiveInteractionRequest extends IInteractionRequest {
	type: "passive";

	/**
	 * A function to enable the interaction request.
	 * This is used to re-enable the interaction after it has been disabled.
	 */
	enable: () => void;
}

export interface IActiveInteractionRequestStored
	extends IActiveInteractionRequest {
	/**
	 * A unique token for the interaction request.
	 * This is used to identify the request when removing it from the store.
	 */
	token: string;
}

export interface IPassiveInteractionRequestStored
	extends IPassiveInteractionRequest {
	/**
	 * A unique token for the interaction request.
	 * This is used to identify the request when removing it from the store.
	 */
	token: string;
}

export interface IShapeDiverStoreInteractionRequestManagement {
	/**
	 * A map of interaction requests currently known by the store.
	 * The key is the viewport ID.
	 * The value is the interaction request object.
	 */
	interactionRequests: {
		[viewportId: string]: {
			activeRequest?: IActiveInteractionRequestStored;
			passiveRequests: IPassiveInteractionRequestStored[];
		};
	};
	/**
	 * Add an interaction request to the store.
	 * This method handles both active and passive requests.
	 *
	 * If the request is active:
	 * - if there already is an active request for the same viewport, it will be replaced.
	 * - disable all passive requests for the same viewport.
	 * If the request is passive:
	 * - disable the request if there is an active request for the same viewport.
	 * - disable all other passive requests for the same viewport.
	 *
	 * @param request The interaction request to add.
	 */
	addInteractionRequest: (
		request: IActiveInteractionRequest | IPassiveInteractionRequest,
	) => string | undefined;
	/**
	 * Remove an interaction request from the store.
	 * This method will remove the request associated with the given token.
	 *
	 * If the request is active:
	 * - enable the first passive request (if there is one).
	 * If the request is passive:
	 * - enable the first passive request (if there is one).
	 *
	 * @param token The token associated with the interaction request to remove.
	 */
	removeInteractionRequest: (token: string) => void;
}
