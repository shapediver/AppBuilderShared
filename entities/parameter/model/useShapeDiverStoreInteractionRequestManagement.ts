import type {IShapeDiverStoreInteractionRequestManagement} from "@AppBuilderLib/entities/parameter/config/shapediverStoreInteractionRequestManagement";
import {devtoolsSettings} from "@AppBuilderLib/shared/config";
import {create} from "zustand";
import {devtools} from "zustand/middleware";

export const useShapeDiverStoreInteractionRequestManagement =
	create<IShapeDiverStoreInteractionRequestManagement>()(
		devtools(
			(set, get) => ({
				interactionRequests: {},

				addInteractionRequest: (request) => {
					const {interactionRequests} = get();
					const {viewportId, type} = request;
					const token = Math.random().toString(36).substring(7);

					if (!interactionRequests[viewportId]) {
						interactionRequests[viewportId] = {
							activeRequest: undefined,
							passiveRequests: [],
						};
					}

					if (type === "active") {
						// Disable and remove all active requests for the same viewport
						if (interactionRequests[viewportId].activeRequest) {
							interactionRequests[
								viewportId
							].activeRequest.disable();
						}
						// Disable all passive requests for the same viewport
						interactionRequests[viewportId].passiveRequests.forEach(
							(req) => req.disable(),
						);
						interactionRequests[viewportId] = {
							activeRequest: {...request, token},
							passiveRequests:
								interactionRequests[viewportId].passiveRequests,
						};
					} else if (type === "passive") {
						if (interactionRequests[viewportId].activeRequest) {
							request.disable();
						}
						interactionRequests[viewportId] = {
							activeRequest:
								interactionRequests[viewportId].activeRequest,
							passiveRequests: [
								...interactionRequests[viewportId]
									.passiveRequests,
								{...request, token},
							],
						};
					}

					set(
						{interactionRequests},
						false,
						`addInteractionRequest ${viewportId}`,
					);

					return token;
				},
				/**
				 * Remove an interaction request from the store.
				 * This method will remove the request associated with the given token.
				 *
				 * If the request is active:
				 * - enable the all passive requests (if there are any).
				 *
				 * @param token The token associated with the interaction request to remove.
				 */
				removeInteractionRequest: (token) => {
					const {interactionRequests} = get();
					let found = false;

					Object.keys(interactionRequests).forEach((viewportId) => {
						const activeRequest =
							interactionRequests[viewportId].activeRequest;
						const passiveRequests =
							interactionRequests[viewportId].passiveRequests;

						if (activeRequest?.token === token) {
							found = true;
							interactionRequests[viewportId].activeRequest =
								undefined;

							passiveRequests.forEach((req) => req.enable());
						} else {
							const index = passiveRequests.findIndex(
								(req) => req.token === token,
							);
							if (index !== -1) {
								passiveRequests.splice(index, 1);
								found = true;
							}
						}
					});

					if (found) {
						set(
							{interactionRequests},
							false,
							`removeInteractionRequest ${token}`,
						);
					}
				},
			}),
			{
				...devtoolsSettings,
				name: "ShapeDiver | InteractionRequestManagement",
			},
		),
	);
