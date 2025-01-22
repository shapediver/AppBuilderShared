import { IShapeDiverParameterDefinition } from "@AppBuilderShared/types/shapediver/parameter";
import { PropsParameterOrExport } from "@AppBuilderShared/types/components/shapediver/propsCommon";

/**
 * Props of a parameter reference.
 */
export interface PropsParameter extends PropsParameterOrExport {

     /**
     * Id of the parameter.
     */
     readonly parameterId: string;

     /**
      * Disable the parameter component if it's in dirty state.
      */
     readonly disableIfDirty?: boolean;

     /** 
      * If true, the component can assume that changes are not executed immediately.
      */
     readonly acceptRejectMode?: boolean,

     /**
      * Properties of the parameter to be overridden.
      */
     readonly overrides?: Pick<Partial<IShapeDiverParameterDefinition>, "displayname" | "group" | "order" | "tooltip" | "hidden">;
}

