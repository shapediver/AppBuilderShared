import {IErrorReportingContext} from "@AppBuilderShared/types/context/errorreportingcontext";
import {createContext} from "react";

export const DummyErrorReporting: IErrorReportingContext = {
	captureException: function (exception: any): string {
		console.debug("Exception captured:", exception);
		return "";
	},
	captureMessage: function (message: string): string {
		console.debug("Message captured:", message);
		return "";
	},
};

export const ErrorReportingContext =
	createContext<IErrorReportingContext>(DummyErrorReporting);
