import {
	useCallback,
	useLayoutEffect,
	useRef,
	useState,
	type CSSProperties,
	type PointerEvent,
} from "react";
import {sizeAfterHandleDrag} from "../lib/sizeAfterHandleDrag";
import AppBuilderHostedAgentWidgetComponent from "./AppBuilderHostedAgentWidgetComponent";
import classes from "./AppBuilderAgentFrame.module.css";

const MIN_WIDTH_PX = 256;
const MIN_HEIGHT_PX = 192;
const MAX_WIDTH_RATIO = 0.9;
const MAX_HEIGHT_RATIO = 0.7;

type DragOrigin = {
	startWidth: number;
	startHeight: number;
	startClientX: number;
	startClientY: number;
};

type FrameLimits = {
	maxWidth: number;
	maxHeight: number;
};

type FrameStyle = CSSProperties & {
	"--agent-frame-max-width"?: string;
	"--agent-frame-max-height"?: string;
};

/**
 * Largest frame size whose top-left handle stays inside the clipping viewport.
 * The frame is anchored on the bottom and right. Caps are 90% of that
 * viewport's width and 70% of its height, and no larger than the open space
 * from those anchored edges to the viewport's top-left.
 */
function frameLimits(wrap: HTMLElement): FrameLimits | null {
	const container = clippingViewport(wrap);
	if (!container) {
		return {
			maxWidth: window.innerWidth * MAX_WIDTH_RATIO,
			maxHeight: window.innerHeight * MAX_HEIGHT_RATIO,
		};
	}
	const containerRect = container.getBoundingClientRect();
	const wrapRect = wrap.getBoundingClientRect();
	if (wrapRect.width <= 0 || wrapRect.height <= 0) {
		return null;
	}
	const availableWidth = wrapRect.right - containerRect.left;
	const availableHeight = wrapRect.bottom - containerRect.top;
	return {
		maxWidth: Math.floor(
			Math.min(
				containerRect.width * MAX_WIDTH_RATIO,
				Math.max(0, availableWidth),
			),
		),
		maxHeight: Math.floor(
			Math.min(
				containerRect.height * MAX_HEIGHT_RATIO,
				Math.max(0, availableHeight),
			),
		),
	};
}

function clippingViewport(wrap: HTMLElement): HTMLElement | null {
	let current = wrap.parentElement;
	while (current) {
		if (clipsOverflow(current)) {
			const rect = current.getBoundingClientRect();
			if (rect.width > 0 && rect.height > 0) {
				return current;
			}
		}
		current = current.parentElement;
	}
	return null;
}

function clipsOverflow(element: HTMLElement): boolean {
	const style = window.getComputedStyle(element);
	return (
		isClippingOverflow(element.style.overflow) ||
		isClippingOverflow(element.style.overflowX) ||
		isClippingOverflow(element.style.overflowY) ||
		isClippingOverflow(style.overflow) ||
		isClippingOverflow(style.overflowX) ||
		isClippingOverflow(style.overflowY)
	);
}

function isClippingOverflow(value: string): boolean {
	return value === "hidden" || value === "clip";
}

export default function AppBuilderAgentFrame() {
	const wrapRef = useRef<HTMLDivElement>(null);
	const dragRef = useRef<DragOrigin | null>(null);
	const [size, setSize] = useState<{width: number; height: number} | null>(
		null,
	);
	const [limits, setLimits] = useState<FrameLimits | null>(null);
	const [dragging, setDragging] = useState(false);

	const publishLimits = useCallback(() => {
		const wrap = wrapRef.current;
		if (!wrap) {
			return;
		}
		const next = frameLimits(wrap);
		if (!next) {
			return;
		}
		setLimits((current) =>
			current &&
			current.maxWidth === next.maxWidth &&
			current.maxHeight === next.maxHeight
				? current
				: next,
		);
	}, []);

	useLayoutEffect(() => {
		publishLimits();
	});

	useLayoutEffect(() => {
		const wrap = wrapRef.current;
		if (!wrap) {
			return;
		}
		let observer: ResizeObserver | undefined;
		if (typeof ResizeObserver !== "undefined") {
			observer = new ResizeObserver(() => publishLimits());
			observer.observe(wrap);
			const container = clippingViewport(wrap);
			if (container) {
				observer.observe(container);
			}
		}
		window.addEventListener("resize", publishLimits);
		return () => {
			observer?.disconnect();
			window.removeEventListener("resize", publishLimits);
		};
	}, [publishLimits]);

	const onHandlePointerMove = useCallback(
		(event: PointerEvent<HTMLButtonElement>) => {
			const origin = dragRef.current;
			const wrap = wrapRef.current;
			if (!origin || !wrap) {
				return;
			}
			const measured = frameLimits(wrap) ?? {
				maxWidth: window.innerWidth * MAX_WIDTH_RATIO,
				maxHeight: window.innerHeight * MAX_HEIGHT_RATIO,
			};
			setSize(
				sizeAfterHandleDrag({
					...origin,
					clientX: event.clientX,
					clientY: event.clientY,
					minWidth: Math.min(MIN_WIDTH_PX, measured.maxWidth),
					minHeight: Math.min(MIN_HEIGHT_PX, measured.maxHeight),
					maxWidth: measured.maxWidth,
					maxHeight: measured.maxHeight,
					edgeX: "left",
					edgeY: "top",
				}),
			);
		},
		[],
	);

	function onHandlePointerDown(event: PointerEvent<HTMLButtonElement>) {
		publishLimits();
		const rect = wrapRef.current?.getBoundingClientRect();
		if (!rect) {
			return;
		}
		event.preventDefault();
		event.currentTarget.setPointerCapture(event.pointerId);
		dragRef.current = {
			startWidth: rect.width,
			startHeight: rect.height,
			startClientX: event.clientX,
			startClientY: event.clientY,
		};
		setDragging(true);
	}

	function onHandlePointerUp(event: PointerEvent<HTMLButtonElement>) {
		dragRef.current = null;
		setDragging(false);
		event.currentTarget.releasePointerCapture(event.pointerId);
	}

	const frameStyle: FrameStyle = {
		...(limits
			? {
					"--agent-frame-max-width": `${limits.maxWidth}px`,
					"--agent-frame-max-height": `${limits.maxHeight}px`,
				}
			: null),
		...(size ? {width: size.width, height: size.height} : null),
	};

	return (
		<div
			ref={wrapRef}
			className={`${classes.wrap}${dragging ? ` ${classes.dragging}` : ""}`}
			style={frameStyle}
		>
			<AppBuilderHostedAgentWidgetComponent height="100%" />
			<button
				type="button"
				className={classes.handle}
				aria-label="Resize agent"
				onPointerDown={onHandlePointerDown}
				onPointerMove={onHandlePointerMove}
				onPointerUp={onHandlePointerUp}
			/>
		</div>
	);
}
