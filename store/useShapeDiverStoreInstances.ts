import {IShapeDiverStoreInstances} from "@AppBuilderShared/types/store/shapediverStoreInstances";
import {create} from "zustand";
import {devtools} from "zustand/middleware";
import {devtoolsSettings} from "./storeSettings";

export const useShapeDiverStoreInstances = create<IShapeDiverStoreInstances>()(
	devtools(
		(set, get) => ({
			customizationResults: {},
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
					`addInstance ${instanceId}`,
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
					`removeInstance ${instanceId}`,
				);
			},

			addCustomizationResult: (instanceId, instance) => {
				set(
					(state) => ({
						customizationResults: {
							...state.customizationResults,
							[instanceId]: instance,
						},
					}),
					false,
					`addCustomizationResult ${instanceId}`,
				);
			},

			removeCustomizationResult: (instanceId) => {
				const {customizationResults} = get();

				if (!customizationResults[instanceId]) return;

				set(
					(state) => {
						const newState = {...state.customizationResults};
						delete newState[instanceId];

						return {customizationResults: newState};
					},
					false,
					`removeCustomizationResult ${instanceId}`,
				);
			},
		}),
		{...devtoolsSettings, name: "ShapeDiver | Instances"},
	),
);
