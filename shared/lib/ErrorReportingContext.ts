import {Logger} from "@AppBuilderShared/utils/logger";
import {createContext} from "react";
import {IErrorReportingContext} from "./ErrorReportingContext.types";

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
