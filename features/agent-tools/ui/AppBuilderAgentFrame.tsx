import {
	useCallback,
	useEffect,
	useRef,
	useState,
	type PointerEvent,
} from "react";
import {sizeAfterBottomLeftDrag} from "../lib/sizeAfterBottomLeftDrag";
import classes from "./AppBuilderAgentFrame.module.css";

const MIN_WIDTH_PX = 256;
const MIN_HEIGHT_PX = 192;

type Props = {
	src: string;
	onPeerWindow: (peer: Window | null) => void;
};

type DragOrigin = {
	startWidth: number;
	startHeight: number;
	startClientX: number;
	startClientY: number;
};

export default function AppBuilderAgentFrame({src, onPeerWindow}: Props) {
	const wrapRef = useRef<HTMLDivElement>(null);
	const dragRef = useRef<DragOrigin | null>(null);
	const [size, setSize] = useState<{width: number; height: number} | null>(
		null,
	);
	const [dragging, setDragging] = useState(false);

	useEffect(() => {
		return () => onPeerWindow(null);
	}, [onPeerWindow]);

	const onHandlePointerMove = useCallback(
		(event: PointerEvent<HTMLButtonElement>) => {
			const origin = dragRef.current;
			if (!origin) {
				return;
			}
			setSize(
				sizeAfterBottomLeftDrag({
					...origin,
					clientX: event.clientX,
					clientY: event.clientY,
					minWidth: MIN_WIDTH_PX,
					minHeight: MIN_HEIGHT_PX,
					maxWidth: window.innerWidth * 0.9,
					maxHeight: window.innerHeight * 0.7,
				}),
			);
		},
		[],
	);

	function onHandlePointerDown(event: PointerEvent<HTMLButtonElement>) {
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

	return (
		<div
			ref={wrapRef}
			className={`${classes.wrap}${dragging ? ` ${classes.dragging}` : ""}`}
			style={size ? {width: size.width, height: size.height} : undefined}
		>
			<iframe
				className={classes.iframe}
				src={src}
				title="ShapeDiver agent"
				onLoad={(event) => {
					onPeerWindow(event.currentTarget.contentWindow);
				}}
			/>
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
