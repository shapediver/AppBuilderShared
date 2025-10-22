import {IAppBuilderWidgetPropsStackUi} from "../shapediver/appbuilder";

/** Type for the contents of a single stack widget */
export type IAppBuilderStackContextElement = IAppBuilderWidgetPropsStackUi;

/** Contextual information for App Builder containers. */
export interface IAppBuilderStackContext {
	/** Push an element onto the stack. */
	push: (element: IAppBuilderStackContextElement) => void;
	/** Pop an element from the stack. */
	pop: () => void;
}
