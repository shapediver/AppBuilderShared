import {IErrorReportingContext} from "@AppBuilderShared/types/context/errorreportingcontext";
import {Logger} from "@AppBuilderShared/utils/logger";
import {createContext} from "react";

export const DummyErrorReporting: IErrorReportingContext = {
	captureException: function (exception: any): string {
		Logger.debug("Exception captured:", exception);
		return "";
	},
	captureMessage: function (message: string): string {
		Logger.debug("Message captured:", message);
		return "";
	},
};

export const ErrorReportingContext =
	createContext<IErrorReportingContext>(DummyErrorReporting);
