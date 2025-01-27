/** Hints for rendering a container. */
export interface IAppBuilderTemplatePageContainerHints {
	/**
	 * If true, use a vertical container layout even if
	 * the container is horizontally oriented.
	 */
	preferVertical?: boolean;
}

/**
 * A container to be rendered by an App Builder template.
 */
export interface IAppBuilderTemplatePageContainer {
	/** The node representing the container. */
	node: React.ReactNode;
	/** Hints for rendering the container. */
	hints?: IAppBuilderTemplatePageContainerHints;
}

/**
 * Common properties of App Builder template pages.
 */
export interface IAppBuilderTemplatePageProps {
	top?: IAppBuilderTemplatePageContainer;
	left?: IAppBuilderTemplatePageContainer;
	right?: IAppBuilderTemplatePageContainer;
	bottom?: IAppBuilderTemplatePageContainer;
	children?: React.ReactNode;
}
