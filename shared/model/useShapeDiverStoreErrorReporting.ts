import {
	devtoolsSettings,
	IShapeDiverStoreErrorReporting,
} from "@AppBuilderLib/shared/config";
import {
	DummyErrorReporting,
	IErrorReportingContext,
} from "@AppBuilderLib/shared/lib";
import {create} from "zustand";
import {devtools} from "zustand/middleware";

interface IShapeDiverStoreErrorReportingInternal extends IShapeDiverStoreErrorReporting {
	setErrorReporting: (errorReportingContext: IErrorReportingContext) => void;
}

/**
 * In addition to making the error reporting implementation available
 * as a context, we expose it as a store to allow accessing it from
 * other stores (where the context can't be used)..
 * @see {@link IShapeDiverStoreErrorReporting}
 */
export const useShapeDiverStoreErrorReporting =
	create<IShapeDiverStoreErrorReportingInternal>()(
		devtools(
			(set) => ({
				errorReporting: DummyErrorReporting,

				setErrorReporting: (
					errorReportingContext: IErrorReportingContext,
				) => {
					set(
						() => ({
							errorReporting: errorReportingContext,
						}),
						false,
						"setErrorReporting",
					);
				},
			}),
			{...devtoolsSettings, name: "ShapeDiver | Error Reporting"},
		),
	);
