import {
	ComponentContext,
	DummyComponent,
} from "@AppBuilderShared/context/ComponentContext";
import {
	DummyErrorReporting,
	ErrorReportingContext,
} from "@AppBuilderShared/context/ErrorReportingContext";
import {
	DummyTracker,
	TrackerContext,
} from "@AppBuilderShared/context/TrackerContext";
import {useShapeDiverStoreErrorReporting} from "@AppBuilderShared/store/useShapeDiverStoreErrorReporting";
import {IComponentContext} from "@AppBuilderShared/types/context/componentcontext";
import {IErrorReportingContext} from "@AppBuilderShared/types/context/errorreportingcontext";
import {ITrackerContext} from "@AppBuilderShared/types/context/trackercontext";
import React, {useEffect} from "react";

interface Props {
	children: React.ReactNode;

	/**
	 * Note: Activate strict mode during development to detect potential bugs.
	 * @see https://react.dev/reference/react/StrictMode
	 */
	useStrictMode?: boolean;

	/**
	 * The optional tracker to use.
	 */
	tracker?: ITrackerContext;

	/**
	 * The optional error reported to use.
	 */
	errorReporting?: IErrorReportingContext;

	/**
	 * The optional component context to use.
	 */
	componentContext?: IComponentContext;
}

export default function RootComponent(props: Props) {
	const {
		children,
		useStrictMode = false,
		tracker,
		errorReporting,
		componentContext,
	} = props;

	const {setErrorReporting} = useShapeDiverStoreErrorReporting();
	useEffect(() => {
		if (errorReporting) {
			setErrorReporting(errorReporting);
		}
	}, [errorReporting, setErrorReporting]);

	return useStrictMode ? (
		<React.StrictMode>
			<ErrorReportingContext.Provider
				value={errorReporting ?? DummyErrorReporting}
			>
				<TrackerContext.Provider value={tracker ?? DummyTracker}>
					<ComponentContext.Provider
						value={componentContext ?? DummyComponent}
					>
						{children}
					</ComponentContext.Provider>
				</TrackerContext.Provider>
			</ErrorReportingContext.Provider>
		</React.StrictMode>
	) : (
		<ErrorReportingContext.Provider
			value={errorReporting ?? DummyErrorReporting}
		>
			<TrackerContext.Provider value={tracker ?? DummyTracker}>
				<ComponentContext.Provider
					value={componentContext ?? DummyComponent}
				>
					{children}
				</ComponentContext.Provider>
			</TrackerContext.Provider>
		</ErrorReportingContext.Provider>
	);
}
