import { createContext } from "react";
import { IDelayedTrackerPropsAwaiter, ITrackerContext, ITrackerEventData, ITrackerEventOptions, TrackerMetricType } from "../types/context/trackercontext";


export class DelayedTrackerPropsAwaiter implements IDelayedTrackerPropsAwaiter {
	/**
     * Names of the properties that should be set after the tracker is initialized.
     * Tracking of any event before these properties are set will be delayed.
     */
	requiredDelayedProps: string[];

	/**
     * Properties that are set after the tracker is initialized.
     */
	delayedProps: { [key: string]: any } = {};

	/**
     * Resolved once all required properties are set.
     */
	requiredPropsAvailable: Promise<boolean>;

	private _resolveRequiredPropsAvailable!: (value: boolean) => void;
	private _requiredPropsAvailableResolved: boolean = false;

	constructor(requiredDelayedProps: string[] = []) {
		this.requiredDelayedProps = requiredDelayedProps;

		// Create the Promise and keep the resolve function
		this.requiredPropsAvailable = new Promise<boolean>((resolve) => {
			this._resolveRequiredPropsAvailable = resolve;
		});

		// Check if we can resolve immediately
		this._checkAndResolveRequiredPropsAvailable();
	}

	/**
     * Sets delayed properties. This may be called multiple times.
     * Tracking of any event before all required properties are set will be delayed.
     * @param props Properties to set.
     */
	setDelayedProps(props: { [key: string]: any }): void {
		// Merge the new properties into delayedProps
		Object.assign(this.delayedProps, props);

		// Check if all required properties are now set
		this._checkAndResolveRequiredPropsAvailable();
	}

	private _checkAndResolveRequiredPropsAvailable(): void {
		if (this._requiredPropsAvailableResolved) {
			return;
		}

		const allRequiredPropsSet = this.requiredDelayedProps.every(
			(propName) => propName in this.delayedProps
		);
	
		if (allRequiredPropsSet) {
			this._requiredPropsAvailableResolved = true;
			this._resolveRequiredPropsAvailable(true);
		}
	}
}

export class CombinedDelayedTrackerPropsAwaiter implements IDelayedTrackerPropsAwaiter {
	/**
     * Names of the properties that should be set after the tracker is initialized.
     * This is the union of all requiredDelayedProps from the individual awaiters.
     */
	requiredDelayedProps: string[];

	/**
     * Properties that are set after the tracker is initialized.
     * This combines the delayedProps from all individual awaiters.
     */
	delayedProps: { [key: string]: any } = {};

	/**
     * Resolved once all required properties are set in all individual awaiters.
     */
	requiredPropsAvailable: Promise<boolean>;

	private awaiters: IDelayedTrackerPropsAwaiter[];

	constructor(awaiters: IDelayedTrackerPropsAwaiter[]) {
		this.awaiters = awaiters;

		// Aggregate requiredDelayedProps from all awaiters
		const requiredPropsSet = new Set<string>();
		for (const awaiter of awaiters) {
			awaiter.requiredDelayedProps.forEach((prop) => requiredPropsSet.add(prop));
		}
		this.requiredDelayedProps = Array.from(requiredPropsSet);

		// Initialize delayedProps by combining from all awaiters
		this.awaiters.forEach((awaiter) => {
			Object.assign(this.delayedProps, awaiter.delayedProps);
		});

		// Create the requiredPropsAvailable Promise
		this.requiredPropsAvailable = Promise.all(this.awaiters.map((awaiter) => awaiter.requiredPropsAvailable)).then(() => true);
	}

	/**
     * Sets delayed properties on all individual awaiters.
     * @param props Properties to set.
     */
	setDelayedProps(props: { [key: string]: any }): void {
		// Update delayedProps
		Object.assign(this.delayedProps, props);

		// Propagate the setDelayedProps call to all individual awaiters
		this.awaiters.forEach((awaiter) => {
			awaiter.setDelayedProps(props);
		});
	}
}


export const DummyTracker: ITrackerContext = {
	trackPageview: function (eventData?: ITrackerEventData, options?: ITrackerEventOptions): void {
		console.debug("Tracking pageview", eventData, options);
	},
	trackEvent: function (eventName: string, options?: ITrackerEventOptions, eventData?: ITrackerEventData): void {
		console.debug("Tracking event", eventName, options, eventData);
	},
	trackMetric: function (type: TrackerMetricType, metricName: string, value: number, options?: ITrackerEventOptions): void {
		console.debug("Tracking metric", type, metricName, value, options);
	},
	delayedPropsAwaiter: new DelayedTrackerPropsAwaiter(),
};

/** Information about a template. */
export const TrackerContext = createContext<ITrackerContext>(DummyTracker);

/**
 * Amend the definition of a tracker with default properties.
 * @param tracker 
 * @param defaultProps 
 * @returns 
 */
export function setDefaultTrackerProps(tracker: ITrackerContext, defaultProps: {[key: string]: any}): ITrackerContext {
	return {
		trackPageview: function (eventData?: ITrackerEventData, options?: ITrackerEventOptions): void {
			const {props = {}, callback = undefined} = options ?? {};
			tracker.trackPageview(eventData, { props: {...defaultProps, ...props}, callback});
		},
		trackEvent: function (eventName: string, options?: ITrackerEventOptions, eventData?: ITrackerEventData): void {
			const {props = {}, callback = undefined} = options ?? {};
			tracker.trackEvent(eventName, { props: {...defaultProps, ...props}, callback}, eventData);
		},
		trackMetric: function (type: TrackerMetricType, metricName: string, value: number, options?: ITrackerEventOptions): void {
			const {props = {}, callback = undefined} = options ?? {};
			tracker.trackMetric(type, metricName, value, { props: {...defaultProps, ...props}, callback});
		},
		delayedPropsAwaiter: tracker.delayedPropsAwaiter,
	};
}

/**
 * Combine two trackers into one.
 * @param trackerA 
 * @param trackerB 
 * @returns Combined tracker.
 */
export function combineTrackers(trackers: ITrackerContext[]): ITrackerContext {
	return {
		trackPageview: function (eventData?: ITrackerEventData, options?: ITrackerEventOptions): void {
			trackers.forEach(t => t.trackPageview(eventData, options));
		},
		trackEvent: function (eventName: string, options?: ITrackerEventOptions, eventData?: ITrackerEventData): void {
			trackers.forEach(t => t.trackEvent(eventName, options, eventData));
		},
		trackMetric: function (type: TrackerMetricType, metricName: string, value: number, options?: ITrackerEventOptions): void {
			trackers.forEach(t => t.trackMetric(type, metricName, value, options));
		},
		delayedPropsAwaiter: new CombinedDelayedTrackerPropsAwaiter(trackers.map(t => t.delayedPropsAwaiter)),
	};
}
