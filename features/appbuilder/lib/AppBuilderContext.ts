import {createContext} from "react";
import {AppBuilderContainerOrientation} from "./AppBuilderContainerOrientation";
import {
	IAppBuilderContainerContext,
	IAppBuilderDataContext,
	IAppBuilderTemplateContext,
} from "./AppBuilderContext.types";

/** Information about a container's context. */
export const AppBuilderContainerContext =
	createContext<IAppBuilderContainerContext>({
		orientation: AppBuilderContainerOrientation.Unspecified,
		name: "unspecified",
	});

/** Information about a template. */
export const AppBuilderTemplateContext =
	createContext<IAppBuilderTemplateContext>({
		name: "unspecified",
	});

/** Information about the App Builder data. */
export const AppBuilderDataContext = createContext<IAppBuilderDataContext>({
	data: undefined,
});
