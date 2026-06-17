/** Contextual information for App Builder containers. */
export interface IAppBuilderStackContext {
	/** Push a stack onto the navigation stack by its `name`. */
	push: (name: string) => void;
	/** Pop an element from the stack. */
	pop: () => void;
	/** Duration of the animation in milliseconds. */
	animationDuration: number;
	/** Whether the stack is transitioning. */
	isTransitioning: boolean;
}
