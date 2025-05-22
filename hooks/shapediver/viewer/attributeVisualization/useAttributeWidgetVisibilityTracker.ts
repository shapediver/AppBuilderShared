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
	const wantsPriorityRef = useRef(props.wantsPriority ?? false);

	const [id] = useState(() => idCounter++);

	// Always keep the latest wantsPriority in ref
	useEffect(() => {
		wantsPriorityRef.current = props.wantsPriority ?? false;

		// Patch current map entry (without triggering notify)
		const current = visibilityMap.get(id) ?? {
			isVisible: false,
			wantsPriority: false,
		};
		visibilityMap.set(id, {
			...current,
			wantsPriority: wantsPriorityRef.current,
		});
	}, [props.wantsPriority, id]);

	useEffect(() => {
		updateMap.set(id, setHasPriority);
		return () => {
			updateMap.delete(id);
		};
	}, [id]);

	useEffect(() => {
		const observer = new IntersectionObserver(
			([entry]) => {
				const currentlyVisible = entry.isIntersecting;
				setIsVisible(currentlyVisible);

				visibilityMap.set(id, {
					isVisible: currentlyVisible,
					wantsPriority: wantsPriorityRef.current,
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
	}, [id]);

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
	};

	const requestPriority = () => {
		updateMap.forEach((setPriority, instanceId) => {
			setPriority(instanceId === id);
		});
	};

	return {ref, isVisible, hasPriority, requestPriority};
}
