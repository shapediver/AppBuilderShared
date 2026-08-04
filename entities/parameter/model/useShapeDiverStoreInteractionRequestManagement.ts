import {devtoolsSettings} from "@AppBuilderLib/shared/config/storeSettings";
import {create} from "zustand";
import {devtools} from "zustand/middleware";
import type {IShapeDiverStoreInteractionRequestManagement} from "../config/shapediverStoreInteractionRequestManagement";

export const useShapeDiverStoreInteractionRequestManagement =
	create<IShapeDiverStoreInteractionRequestManagement>()(
		devtools(
			(set, get) => ({
				interactionRequests: {},

				addInteractionRequest: (request) => {
					const {interactionRequests} = get();
					const {viewportId, type} = request;
					const token = crypto.randomUUID();

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
				activatePassiveInteraction: (token) => {
					const {interactionRequests} = get();
					for (const viewportId of Object.keys(interactionRequests)) {
						const requests = interactionRequests[viewportId];
						const passiveRequest = requests.passiveRequests.find(
							(request) => request.token === token,
						);
						if (!passiveRequest) continue;

						const activeRequest = requests.activeRequest;
						requests.activeRequest = undefined;
						activeRequest?.disable();
						requests.passiveRequests.forEach((request) =>
							request.enable(),
						);
						set({interactionRequests}, false, "activatePassiveInteraction");
						return;
					}
				},
			}),
			{
				...devtoolsSettings,
				name: "ShapeDiver | InteractionRequestManagement",
			},
		),
	);
