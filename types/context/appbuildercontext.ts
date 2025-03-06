import {IAppBuilder} from "../shapediver/appbuilder";

/** Types of containers */
export type AppBuilderContainerOrientationType =
	| "unspecified"
	| "horizontal"
	| "vertical";

/** Contextual information for App Builder containers. */
export interface IAppBuilderContainerContext {
	/** Orientation of the container. */
	orientation: AppBuilderContainerOrientationType;
	/** Name of the container. */
	name: string;
}

/** Types of templates */
export type AppBuilderTemplateType = "appshell" | "grid" | "unspecified";

/** Contextual information for App Builder template. */
export interface IAppBuilderTemplateContext {
	name: AppBuilderTemplateType;
}

/** Contextual information containing for App Builder data. */
export interface IAppBuilderDataContext {
	data: IAppBuilder | undefined;
}
