import { QUERYPARAM_CONTEXT, QUERYPARAM_MODELSTATEID, QUERYPARAM_MODELVIEWURL, QUERYPARAM_SETTINGSURL, QUERYPARAM_SLUG, QUERYPARAM_TICKET } from "@AppBuilderShared/types/shapediver/queryparams";

/**
 * Data for building a ShapeDiver App Builder URL.
 */
export interface IAppBuilderUrlBuilderData {
    /**
     * The base URL to use (origin and path).
     */
    baseUrl: string;

    /**
     * The model view URL of the model to use. 
     * Provide this and a ticket, or provide a slug.
     */
    modelViewUrl?: string;

    /**
     * The ShapeDiver ticket for embedding. 
     * Provide this and a modelViewUrl, or provide a slug.
     */
    ticket?: string;

    /**
     * The slug of the model on the ShapeDiver platform.
     */
    slug?: string;

    /**
     * The optional model state id.
     */
    modelStateId?: string;

    /**
     * Optional URL (relative or absolute) to a settings JSON file.
     */
    settingsUrl?: string

    /**
     * Context to be passed to the configurator. Typical values: 
     *   * undefined (default)
     *   * "cart" (opened from the cart)
     *   * "order" (opened from an order)
     */
    context?: string
}

/**
 * Build a ShapeDiver App Builder URL from the given data.
 * @param data 
 * @returns 
 */
export function buildAppBuilderUrl(data: IAppBuilderUrlBuilderData): string {

	const { baseUrl, ticket, modelViewUrl, slug, settingsUrl, modelStateId, context } = data;

	const url = new URL(baseUrl);
	const searchParams = new URLSearchParams();
	if (slug) {
		searchParams.append(QUERYPARAM_SLUG, slug);
	}
	else if (ticket && modelViewUrl) {
		searchParams.append(QUERYPARAM_TICKET, ticket);
		searchParams.append(QUERYPARAM_MODELVIEWURL, modelViewUrl);
	}
	else if (!settingsUrl) {
		throw new Error("Either settingsUrl or slug or both ticket and modelViewUrl must be provided.");
	}

	if (settingsUrl) {
		searchParams.append(QUERYPARAM_SETTINGSURL, settingsUrl);
	}

	if (modelStateId) {
		searchParams.append(QUERYPARAM_MODELSTATEID, modelStateId);
	}

	if (context) {
		searchParams.append(QUERYPARAM_CONTEXT, context);
	}

	url.search = searchParams.toString();
	
	return url.toString();
}
