import {useCallback, useMemo, useState} from "react";
import {IAppBuilderStackContextElement} from "~/shared/types/context/stackcontext";

export const useStackContext = (animationDurationMs: number = 300) => {
	const [stackElements, setStackElements] = useState<
		IAppBuilderStackContextElement[]
	>([]);
	const [isTransitioning, setIsTransitioning] = useState(false);
	const animationDuration = useMemo(
		() => animationDurationMs,
		[animationDurationMs],
	);

	const push = useCallback((element: IAppBuilderStackContextElement) => {
		setStackElements((prev) => [...prev, element]);
	}, []);

	const pop = useCallback(() => {
		setIsTransitioning(true);
		setTimeout(() => {
			setStackElements((prev) => prev.slice(0, -1));
			setIsTransitioning(false);
		}, animationDuration);
	}, [animationDuration]);

	const currentStackElement = stackElements[stackElements.length - 1];

	return {
		stackElements,
		isTransitioning,
		setIsTransitioning,
		animationDuration,
		push,
		pop,
		currentStackElement,
	};
};
