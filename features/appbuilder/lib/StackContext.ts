import {createContext} from "react";
import {IAppBuilderStackContext} from "./StackContext.types";

/** Default slide duration for stack open/close (ms). */
export const STACK_ANIMATION_DURATION_MS = 300;

/** Stack navigation context for App Builder containers. */
export const AppBuilderStackContext = createContext<IAppBuilderStackContext>({
	push: () => {},
	pop: () => {},
	animationDuration: STACK_ANIMATION_DURATION_MS,
	isTransitioning: false,
});
