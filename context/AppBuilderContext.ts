import { IAppBuilderContainerContext, IAppBuilderTemplateContext } from "@AppBuilderShared/types/context/appbuildercontext";
import { createContext } from "react";

/** Information about a container's context. */
export const AppBuilderContainerContext = createContext<IAppBuilderContainerContext>({
	orientation: "unspecified",
	name: "unspecified"
});

/** Information about a template. */
export const AppBuilderTemplateContext = createContext<IAppBuilderTemplateContext>({
	name: "unspecified"
});
