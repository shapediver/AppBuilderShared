import {IErrorReportingContext} from "../context/errorreportingcontext";

/**
 * In addition to making the error reporting implementation available
 * as a context, we expose it as a store to allow accessing it from
 * other stores (where the context can't be used).
 */
export interface IShapeDiverStoreErrorReporting {
	errorReporting: IErrorReportingContext;
}
