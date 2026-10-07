import type {IAppBuilderActionPropsCreateModelState} from "@AppBuilderLib/features/appbuilder/config/appbuilderActions";

import type {
	IModelStateWireCreateData,
	IModelStateWireCreateResult,
} from "./modelStateWire";

/**
 * Data accepted when creating a model state (hook, e-commerce connector, stores).
 * The cross-window payload plus the action's image and screenshot fields.
 */
export type ICreateModelStateData = Omit<
	IAppBuilderActionPropsCreateModelState,
	"successMessage" | "errorMessage"
> &
	IModelStateWireCreateData;

/** Data returned from the useCreateModelState hook. */
export type ICreateModelStateResult = IModelStateWireCreateResult;
