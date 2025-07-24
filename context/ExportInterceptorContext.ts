import {IExportInterceptorContext} from "@AppBuilderShared/types/context/exportinterceptorcontext";
import {createContext} from "react";

export const ExportInterceptorContext =
	createContext<IExportInterceptorContext>({});
