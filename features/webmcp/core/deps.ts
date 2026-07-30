import type {IShapeDiverParameter} from "@AppBuilderLib/entities/parameter/config/parameter";
import type {IShapeDiverParameterDefinition} from "@AppBuilderLib/entities/parameter/config/parameter";
import type {IShapeDiverStoreParameters} from "@AppBuilderLib/entities/parameter/config/shapediverStoreParameters";
import type {
	ICreateModelStateData,
	ICreateModelStateResult,
} from "@AppBuilderLib/features/model-state/config/createModelState";
import type {
	IImportModelStateData,
	IImportModelStateResult,
} from "@AppBuilderLib/features/model-state/config/importModelState";

/** Per-choice UI metadata surfaced from the theme (description/displayname/imageUrl). */
export interface ChoiceMetadata {
	description?: string;
	displayname?: string;
	imageUrl?: string;
}

export interface ToolDeps {
	namespace: string;
	getLiveParameters: (namespace: string) => IShapeDiverParameter<any>[];
	listParameterNamespaces: () => string[];
	batchParameterValueUpdate: IShapeDiverStoreParameters["batchParameterValueUpdate"];
	createModelState: (
		props: ICreateModelStateData,
	) => Promise<ICreateModelStateResult>;
	importModelState: (
		props: IImportModelStateData,
	) => Promise<IImportModelStateResult>;
	/**
	 * Returns per-choice UI metadata (keyed by choice name) for a parameter,
	 * sourced from the theme's `ParameterSelectComponent.componentSettings[<name>].itemData`.
	 * Optional — adapters without theme access leave it undefined.
	 */
	getChoiceMetadata?: (
		namespace: string,
		def: IShapeDiverParameterDefinition,
	) => Record<string, ChoiceMetadata> | undefined;
}
