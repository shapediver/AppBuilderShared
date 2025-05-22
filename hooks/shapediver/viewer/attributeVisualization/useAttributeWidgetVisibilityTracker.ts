import {useEffect, useRef, useState} from "react";

const visibilityMap = new Map<
	number,
	{isVisible: boolean; wantsPriority: boolean}
>();
const updateMap = new Map<number, (hasPriority: boolean) => void>();
let idCounter = 0;

export function useAttributeWidgetVisibilityTracker(props: {
	wantsPriority?: boolean;
}) {
	const ref = useRef(null);
	const [isVisible, setIsVisible] = useState(false);
	const [hasPriority, setHasPriority] = useState(false);
	const [noPriority, setNoPriority] = useState(true);

	const [id] = useState(() => idCounter++);

	/**
	 * UseEffect to set the setter function for the current element
	 * and remove it when the component is unmounted
	 */
	useEffect(() => {
		updateMap.set(id, setHasPriority);
		return () => {
			updateMap.delete(id);
		};
	}, [id]);

	/**
	 * UseEffect to create an IntersectionObserver
	 * and set the visibility state
	 * and the priority state for the current element
	 */
	useEffect(() => {
		const observer = new IntersectionObserver(
			([entry]) => {
				const currentlyVisible = entry.isIntersecting;
				setIsVisible(currentlyVisible);

				visibilityMap.set(id, {
					isVisible: currentlyVisible,
					wantsPriority: props.wantsPriority ?? false,
				});

				notifyAll();
			},
			{threshold: 0.1},
		);

		if (ref.current) observer.observe(ref.current);

		return () => {
			if (ref.current) observer.unobserve(ref.current);
			visibilityMap.delete(id);
			notifyAll();
		};
	}, [id, props.wantsPriority]);

	/**
	 * Notify all elements about the current visibility state
	 * and set the priority for the first element
	 */
	const notifyAll = () => {
		const visibleEntries = Array.from(visibilityMap.entries())
			.filter(([, data]) => data.isVisible)
			.sort((a, b) => a[0] - b[0])
			.sort((a, b) => {
				if (a[1].wantsPriority && !b[1].wantsPriority) return -1;
				if (!a[1].wantsPriority && b[1].wantsPriority) return 1;
				return 0;
			});

		const priorityElementId = visibleEntries[0]?.[0];
		updateMap.forEach((setPriority, instanceId) => {
			setPriority(instanceId === priorityElementId);
		});

		setNoPriority(visibleEntries.length === 0);
	};

	/**
	 * Enable the priority for the current element
	 * And disable it for all other elements
	 */
	const requestPriority = () => {
		updateMap.forEach((setPriority, instanceId) => {
			setPriority(instanceId === id);
		});
		setNoPriority(false);
	};

	return {ref, isVisible, hasPriority, noPriority, requestPriority};
}
