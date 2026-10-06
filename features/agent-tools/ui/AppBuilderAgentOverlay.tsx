import {useLayoutEffect, useRef, useState} from "react";
import type {AppBuilderAgentOverlayProps} from "../config/appBuilderAgentHost";
import AppBuilderAgentFrame from "./AppBuilderAgentFrame";
import classes from "./AppBuilderAgentOverlay.module.css";

export type {AppBuilderAgentOverlayProps};

/**
 * Floating agent iframe. The toolbar button lives in the viewport toolbar.
 * Hiding the slot keeps the iframe mounted so the next open does not reload.
 * The slot is docked to the measured agent button so it shares that corner.
 */
export default function AppBuilderAgentOverlay({
	agentUrl,
	mode,
	panelMounted,
	panelVisible,
	onPeerWindow,
}: AppBuilderAgentOverlayProps) {
	const slotRef = useRef<HTMLDivElement>(null);
	const [insets, setInsets] = useState<{
		right: number;
		bottom: number;
	} | null>(null);
	const active = mode === "iframe" && panelMounted && Boolean(agentUrl);

	useLayoutEffect(() => {
		if (!active) {
			return;
		}
		const slot = slotRef.current;
		const viewport = slot?.parentElement;
		if (!slot || !viewport) {
			return;
		}

		const measure = () => {
			const toolbar = viewport.querySelector<HTMLElement>(
				'[data-toolbar-id^="agentUi"]',
			);
			if (!toolbar) {
				setInsets(null);
				return;
			}
			const viewportRect = viewport.getBoundingClientRect();
			const toolbarRect = toolbar.getBoundingClientRect();
			const next = {
				right: Math.max(0, viewportRect.right - toolbarRect.right),
				bottom: Math.max(
					0,
					viewportRect.bottom - toolbarRect.top + 8,
				),
			};
			setInsets((current) =>
				current &&
				current.right === next.right &&
				current.bottom === next.bottom
					? current
					: next,
			);
		};

		measure();
		if (typeof ResizeObserver === "undefined") {
			return;
		}
		const observer = new ResizeObserver(measure);
		observer.observe(viewport);
		const toolbar = viewport.querySelector('[data-toolbar-id^="agentUi"]');
		if (toolbar) {
			observer.observe(toolbar);
		}
		window.addEventListener("resize", measure);
		return () => {
			observer.disconnect();
			window.removeEventListener("resize", measure);
		};
	}, [active]);

	if (!active || !agentUrl) {
		return null;
	}

	return (
		<div
			ref={slotRef}
			className={classes.slot}
			style={{
				display: panelVisible ? "block" : "none",
				...(insets
					? {right: insets.right, bottom: insets.bottom}
					: null),
			}}
		>
			<AppBuilderAgentFrame src={agentUrl} onPeerWindow={onPeerWindow} />
		</div>
	);
}
