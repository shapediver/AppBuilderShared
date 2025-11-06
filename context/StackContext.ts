import {IAppBuilderStackContext} from "@AppBuilderShared/types/context/stackcontext";
import {createContext} from "react";

/** Information about a container's context. */
export const AppBuilderStackContext = createContext<IAppBuilderStackContext>({
	push: () => {},
	pop: () => {},
	animationDuration: 300,
	isTransitioning: false,
	setIsTransitioning: () => {},
});
