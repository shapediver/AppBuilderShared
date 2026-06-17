import {createContext} from "react";
import {IAppBuilderStackContext} from "./StackContext.types";

/** Stack navigation context for App Builder containers. */
export const AppBuilderStackContext = createContext<IAppBuilderStackContext>({
	push: () => {},
	pop: () => {},
	animationDuration: 300,
	isTransitioning: false,
});
