import {createContext} from "react";
import {IAppBuilderStackContext} from "./StackContext.types";

/** Information about a container's context. */
export const AppBuilderStackContext = createContext<IAppBuilderStackContext>({
	push: () => {},
	pop: () => {},
	animationDuration: 300,
	isTransitioning: false,
	setIsTransitioning: () => {},
});
