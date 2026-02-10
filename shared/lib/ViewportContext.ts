import {createContext} from "react";
import {IViewportContext} from "./ViewportContext.types";

/** Information about a template. */
export const ViewportContext = createContext<IViewportContext>({
	viewportId: "viewport_1",
});
