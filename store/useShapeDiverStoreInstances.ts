import {IShapeDiverStoreInstances} from "@AppBuilderShared/types/store/shapediverStoreInstances";
import {create} from "zustand";
import {devtools} from "zustand/middleware";
import {devtoolsSettings} from "./storeSettings";

export const useShapeDiverStoreInstances = create<IShapeDiverStoreInstances>()(
	devtools(
		(set, get) => ({
			instances: {},

			addInstance: (instanceId, instance) => {
				set(
					(state) => ({
						instances: {
							...state.instances,
							[instanceId]: instance,
						},
					}),
					false,
					`addInstances ${instanceId}`,
				);
			},

			removeInstance: (instanceId) => {
				const {instances} = get();

				if (!instances[instanceId]) return;

				set(
					(state) => {
						const newState = {...state.instances};
						delete newState[instanceId];

						return {instances: newState};
					},
					false,
					`removeInstances ${instanceId}`,
				);
			},
		}),
		{...devtoolsSettings, name: "ShapeDiver | Instances"},
	),
);
