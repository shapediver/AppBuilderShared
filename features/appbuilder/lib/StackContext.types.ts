import type {IAppBuilderWidgetPropsStackUi} from "../config/appbuilder";

/** Type for the contents of a single stack widget */
export type IAppBuilderStackContextElement = IAppBuilderWidgetPropsStackUi;

/** Contextual information for App Builder containers. */
export interface IAppBuilderStackContext {
	/** Push an element onto the stack. */
	push: (element: IAppBuilderStackContextElement) => void;
	/** Pop an element from the stack. */
	pop: () => void;
	/** Duration of the animation in milliseconds. */
	animationDuration: number;
	/** Whether the stack is transitioning. */
	isTransitioning: boolean;
	/** Set whether the stack is transitioning. */
	setIsTransitioning: (isTransitioning: boolean) => void;
}
