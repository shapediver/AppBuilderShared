import {createContext} from "react";
import {IExportInterceptorContext} from "./ExportInterceptorContext.types";

export const ExportInterceptorContext =
	createContext<IExportInterceptorContext>({});
