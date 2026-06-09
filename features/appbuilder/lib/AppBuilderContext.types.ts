import {IAppBuilder} from "../config/appbuilder";
import type {AppBuilderContainerOrientationType} from "./AppBuilderContainerOrientation";
import type {AppBuilderTemplateType} from "./AppBuilderTemplate";

/** Contextual information for App Builder containers. */
export interface IAppBuilderContainerContext {
	/** Orientation of the container. */
	orientation: AppBuilderContainerOrientationType;
	/** Name of the container. */
	name: string;
}

/** Contextual information for App Builder template. */
export interface IAppBuilderTemplateContext {
	name: AppBuilderTemplateType;
}

/** Contextual information containing for App Builder data. */
export interface IAppBuilderDataContext {
	data: IAppBuilder | undefined;
}
