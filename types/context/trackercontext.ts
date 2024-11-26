
export interface ITrackerEventData {
    /** The current device's width. Defaults to window.innerWidth */
    deviceWidth?: Window["innerWidth"]
    /** The referrer to bind the event to. Defaults to document.referrer */
    referrer?: Document["referrer"] | null
    /** The URL to bind the event to. Defaults to location.href. */
    url?: Location["href"]
}

export interface ITrackerEventOptions {
    /** Callback called when the event is successfully sent */
    callback?: undefined | (() => void)
    /** Properties to be bound to the event. */
    props?: undefined | {[key: string]: any}
}

export type TrackerMetricType = "Web vitals";

export interface IDelayedTrackerPropsAwaiter {
    /**
     * Names of the properties that should be set after the tracker is initialized.
     * Tracking of any event before these properties are set will be delayed.
     */
    requiredDelayedProps: string[]

    /**
     * Properties that are set after the tracker is initialized. Once
     * all required properties are set, requiredPropsAvailable will be resolved, 
     * which causes events that have been queued to be tracked.
     */
    delayedProps: {[key: string]: any}

    /**
     * Sets delayed properties. This may be called multiple times. 
     * Tracking of any event before all required properties are set will be delayed.
     * @param props Properties to set.
     */
    setDelayedProps(props: {[key: string]: any}): void

    /**
     * Resolved once all required properties are set.
     */
    requiredPropsAvailable: Promise<boolean>
}

export interface ITrackerContext {

    /**
     * Manually tracks a page view. 
     * @param eventData Optional event data to send. Defaults to the current page's data merged with the default options.
     * @param options Optional event options.
     */
    trackPageview(
        eventData?: ITrackerEventData, 
        options?: ITrackerEventOptions,
    ): void

    /**
     * Tracks a custom event.
     * Use it to track your defined goals by providing the goal's name as eventName.
     * @param eventName Name of the event to track.
     * @param options Optional event options.
     * @param eventData Optional event data to send. Defaults to the current page's data merged with the default options.
     */
    trackEvent(
        eventName: string,
        options?: ITrackerEventOptions,
        eventData?: ITrackerEventData,
    ): void

    /**
     * Tracks a custom metric.
     * Depending on the implementation of the tracker, the metric might be tracked as an event
     * whose name will be set to the value of type.
     * @param type Type of the metric to track.
     * @param metricName Name of the metric to track.
     * @param value Value of the tracked metric.
     */
    trackMetric(
        type: TrackerMetricType,
        metricName: string,
        value: number,
        options?: ITrackerEventOptions,
    ): void

    /**
     * Helper for delayed properties.
     */
    delayedPropsAwaiter: IDelayedTrackerPropsAwaiter

}
