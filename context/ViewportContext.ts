import {IViewportContext} from "@AppBuilderShared/types/context/viewportcontext";
import {createContext} from "react";

/** Information about a template. */
export const ViewportContext = createContext<IViewportContext>({
	viewportId: "viewport_1",
});
