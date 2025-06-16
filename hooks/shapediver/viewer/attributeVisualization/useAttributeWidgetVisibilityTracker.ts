import {IViewportApi, RENDERER_TYPE} from "@shapediver/viewer.viewport";
import {useCallback, useEffect, useRef, useState} from "react";

// Map of element IDs to their properties
const visibilityMap = new Map<
	number,
	{
		isVisible: boolean;
		wantsPriority: boolean;
		viewport?: IViewportApi;
	}
>();
// Map of element IDs to their updater functions
const updateMap = new Map<
	number,
	{
		setHasPriority: (v: boolean) => void;
		setIsVisible: (v: boolean) => void;
	}
>();
// Map of DOM elements to their IDs
const targetMap = new WeakMap<Element, number>();
// Counter for unique IDs
let idCounter = 0;

// IntersectionObserver instance
// This is a singleton to avoid creating multiple observers
let observer: IntersectionObserver | null = null;

export function useAttributeWidgetVisibilityTracker(props: {
	wantsPriority?: boolean;
	viewport: IViewportApi;
}) {
	const ref = useRef(null);
	const [isVisible, setIsVisible] = useState(false);
	const [hasPriority, setHasPriority] = useState(false);
	const [id] = useState(() => idCounter++);

	// Ref to store the current wantsPriority value
	const wantsPriorityRef = useRef(props.wantsPriority ?? false);

	/**
	 * UseEffect to update the visibilityMap when the wantsPriority prop changes.
	 * This ensures that the visibilityMap always has the latest wantsPriority value
	 */
	useEffect(() => {
		wantsPriorityRef.current = props.wantsPriority ?? false;
		const prev = visibilityMap.get(id) ?? {
			isVisible: false,
			wantsPriority: false,
		};
		visibilityMap.set(id, {
			...prev,
			wantsPriority: wantsPriorityRef.current,
			viewport: props.viewport,
		});
	}, [props.wantsPriority, props.viewport, id]);

	/**
	 * UseEffect to set the setHasPriority and setIsVisible functions in the updateMap.
	 */
	useEffect(() => {
		updateMap.set(id, {setHasPriority, setIsVisible});
		return () => {
			updateMap.delete(id);
		};
	}, [id]);

	/**
	 * UseEffect to set the element ID in the targetMap and observe the element with the IntersectionObserver.
	 * This ensures that the observer is only created once and that the element is only observed when it is mounted.
	 */
	useEffect(() => {
		initObserver();
		const el = ref.current;
		if (!el || !observer) return;

		targetMap.set(el, id);
		observer.observe(el);

		return () => {
			if (observer && el) {
				observer.unobserve(el);
				targetMap.delete(el);
			}
			visibilityMap.delete(id);
			notifyAll();
		};
	}, [id]);

	/**
	 * Request priority for the current element.
	 * This function is called in the element when being clicked.
	 * It sets the hasPriority state to true for the current element and false for all other elements.
	 */
	const requestPriority = useCallback(() => {
		updateMap.forEach((updaters, instanceId) => {
			updaters.setHasPriority(instanceId === id);
		});
	}, [id]);

	const removePriority = useCallback(() => {
		setHasPriority(false);
		disableAttributeVisualization();
	}, []);

	return {ref, isVisible, hasPriority, requestPriority, removePriority};
}

/**
 * Initialize the IntersectionObserver instance if it is not already created.
 * This function is called in the useEffect hook when the component is mounted.
 */
const initObserver = () => {
	if (observer) return;

	observer = new IntersectionObserver(
		(entries) => {
			for (const entry of entries) {
				const id = targetMap.get(entry.target);
				if (id === undefined) continue;

				const currentlyVisible = entry.isIntersecting;

				const prev = visibilityMap.get(id) ?? {
					isVisible: false,
					wantsPriority: false,
				};
				visibilityMap.set(id, {
					...prev,
					isVisible: currentlyVisible,
				});

				// Update the component’s local state
				updateMap.get(id)?.setIsVisible(currentlyVisible);
			}

			notifyAll();
		},
		{threshold: 0.1},
	);
};

const disableAttributeVisualization = () => {
	// get all viewports
	const viewports = Array.from(visibilityMap.values())
		.map((data) => data.viewport)
		.filter((v): v is IViewportApi => !!v);

	// filter out duplicates
	const uniqueViewports = Array.from(new Set(viewports.map((v) => v.id))).map(
		(id) => viewports.find((v) => v.id === id),
	);

	// toggle attribute visualization off
	uniqueViewports.forEach((viewport) => {
		if (!viewport) return;
		if (viewport.type === RENDERER_TYPE.ATTRIBUTES) {
			viewport.type = RENDERER_TYPE.STANDARD;
		}
	});
};

/**
 * Notify all elements about their visibility and priority status.
 * This function is called in the IntersectionObserver callback when the visibility of an element changes.
 *
 * When no elements are visible, the function will toggle the attribute visualization off.
 */
const notifyAll = () => {
	const visibleEntries = Array.from(visibilityMap.entries())
		.filter(([, data]) => data.isVisible && data.wantsPriority)
		.sort((a, b) => a[0] - b[0])
		.sort((a, b) => {
			if (a[1].wantsPriority && !b[1].wantsPriority) return -1;
			if (!a[1].wantsPriority && b[1].wantsPriority) return 1;
			return 0;
		});

	const priorityElementId = visibleEntries[0]?.[0];

	updateMap.forEach((updaters, instanceId) => {
		updaters.setHasPriority(instanceId === priorityElementId);
	});

	// if no element is visible, toggle attribute visualization off
	// and set the viewport type to standard
	// this is done here as it is not related to a single element
	// as no attribute visualization widget might be visible at this point
	if (priorityElementId === undefined) {
		disableAttributeVisualization();
	}
};
