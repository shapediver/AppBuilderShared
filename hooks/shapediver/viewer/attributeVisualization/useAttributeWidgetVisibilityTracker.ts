import {IViewportApi, RENDERER_TYPE} from "@shapediver/viewer.viewport";
import {useCallback, useEffect, useRef, useState} from "react";

// Map of element IDs to their properties
const visibilityMap = new Map<
	number,
	{
		element: HTMLElement;
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
	const updateVisibilityRef = useRef(() => {});

	/**
	 * Set the ref to the current wantsPriority value.
	 * This is used to ensure that the latest value is always used when the observer callback is called.
	 */
	useEffect(() => {
		wantsPriorityRef.current = props.wantsPriority ?? false;

		// If the wantsPriority changes, we need to update the visibilityMap
		if (visibilityMap.has(id)) {
			const entry = visibilityMap.get(id);
			if (entry) {
				visibilityMap.set(id, {
					...entry,
					wantsPriority: wantsPriorityRef.current,
				});
			}
		}
	}, [props.wantsPriority]);

	/**
	 * UseEffect to register the element and update the visibilityMap
	 * when wantsPriority or viewport changes.
	 * This ensures the element is tracked correctly with the latest data.
	 */
	useEffect(() => {
		const el = ref.current;
		if (!el) return;

		// Update existing or set new entry
		const prev = visibilityMap.get(id) ?? {
			element: el,
			isVisible: false,
			wantsPriority: wantsPriorityRef.current,
			viewport: props.viewport,
		};

		visibilityMap.set(id, {
			...prev,
			element: el,
			wantsPriority: wantsPriorityRef.current,
			viewport: props.viewport,
		});

		// Initial visibility check after element is set
		updateVisibility();

		return () => {
			visibilityMap.delete(id);
			notifyAll();
		};
	}, [props.viewport, id]);

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

		observer.observe(el);

		return () => {
			if (observer && el) observer.unobserve(el);
		};
	}, [id]);

	/**
	 * Manual visibility check for all tracked elements.
	 * This replaces the IntersectionObserver logic by checking visibility on scroll and resize.
	 */
	const updateVisibility = useCallback(() => {
		for (const [entryId, entry] of Array.from(visibilityMap.entries())) {
			const el = entry.element;
			const prev = entry;

			const visible = isElementVisible(el);

			if (prev.isVisible !== visible) {
				visibilityMap.set(entryId, {
					...prev,
					isVisible: visible,
				});
				updateMap.get(entryId)?.setIsVisible(visible);
			}
		}
		notifyAll();
	}, []);

	/**
	 * UseEffect to update the visibilityRef with the latest updateVisibility function.
	 * This ensures that the latest function is always used when the observer callback is called.
	 */
	useEffect(() => {
		updateVisibilityRef.current = updateVisibility;
	}, [updateVisibility]);

	/**
	 * Initialize the IntersectionObserver if it is not already created.
	 * This function is called in the useEffect to ensure the observer is created only once.
	 */
	const initObserver = () => {
		if (observer) return;

		observer = new IntersectionObserver(
			() => {
				updateVisibilityRef.current();
			},
			{threshold: 0.1},
		);
	};

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
 * This function disables the attribute visualization for all viewports if no elements are visible.
 * It checks all viewports in the visibilityMap and sets their type to STANDARD if they are currently set to ATTRIBUTES.
 * This is useful to ensure that the attribute visualization is only active when there are visible elements that want priority.
 * If no elements are visible, it will toggle the attribute visualization off for all viewports.
 */
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
 * Checks if the element is visible in the viewport.
 * This function checks if the element has a non-zero size and is not hidden by CSS.
 *
 * @param el - The HTML element to check visibility for.
 * @returns true if the element is visible, false otherwise.
 */
const isElementVisible = (el: HTMLElement) => {
	// Checks if the element has a non-zero size and is visible
	return !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length);
};

/**
 * Notify all elements about their visibility and priority status.
 * This function is called in the IntersectionObserver callback when the visibility of an element changes.
 *
 * When no elements are visible, the function will toggle the attribute visualization off.
 */
const notifyAll = () => {
	const visibilityMapEntries = Array.from(visibilityMap.entries());
	const visibleEntries = visibilityMapEntries
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

	// if there is no element with priority, we disable the attribute visualization
	// but only if there are visible elements that do not want priority
	if (
		priorityElementId === undefined &&
		visibilityMapEntries.filter(([, data]) => data.isVisible).length > 0
	) {
		disableAttributeVisualization();
	}
};
