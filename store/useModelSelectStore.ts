import {IUseSessionDto} from "@AppBuilderShared/hooks/shapediver/useSession";
import {create} from "zustand";

export interface ISelectedModel extends IUseSessionDto {
	name: string;
	slug: string;
}

interface IModelSelectState {
	selectedModels: ISelectedModel[];
	setSelectedModels: (selectedModels: ISelectedModel[]) => void;
}

/**
 * State store for the selected models of the ModelSelect component.
 */
export const useModelSelectStore = create<IModelSelectState>((set) => ({
	selectedModels: [],
	setSelectedModels: (selectedModels) =>
		set((state) => ({
			...state,
			selectedModels,
		})),
}));
