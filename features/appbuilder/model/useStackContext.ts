import {IAppBuilderStackContext} from "@AppBuilderLib/features/appbuilder/lib/StackContext.types";
import {useCallback, useEffect, useMemo, useRef, useState} from "react";

export const useStackContext = (animationDuration = 300) => {
	const [stackPath, setStackPath] = useState<string[]>([]);
	const [isTransitioning, setIsTransitioning] = useState(false);
	const popTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
	const push = useCallback(
		(name: string) => {
			if (isTransitioning) {
				return;
			}
			// At most one active stack per context level; new push is a no-op when already open.
			setStackPath((path) => (path.length > 0 ? path : [name]));
		},
		[isTransitioning],
	);

	const pop = useCallback(() => {
		if (isTransitioning) {
			return;
		}
		setIsTransitioning(true);
		clearTimeout(popTimeoutRef.current);
		popTimeoutRef.current = setTimeout(() => {
			setStackPath((path) => path.slice(0, -1));
			setIsTransitioning(false);
		}, animationDuration);
	}, [animationDuration, isTransitioning]);

	const context: IAppBuilderStackContext = useMemo(
		() => ({
			push,
			pop,
			animationDuration,
			isTransitioning,
		}),
		[push, pop, animationDuration, isTransitioning],
	);

	useEffect(() => {
		return () => clearTimeout(popTimeoutRef.current);
	}, []);

	return {stackPath, context};
};
