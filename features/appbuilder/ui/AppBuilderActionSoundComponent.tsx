import AppBuilderActionComponent from "./AppBuilderActionComponent";
import {IAppBuilderLegacyActionPropsSound} from "@AppBuilderShared/types/shapediver/appbuilder";
import {Logger} from "@AppBuilderShared/utils/logger";
import React, {useCallback, useEffect, useRef, useState} from "react";

type Props = IAppBuilderLegacyActionPropsSound;

/**
 * Functional component for a "sound" action.
 *
 * @returns
 */
export default function AppBuilderActionSoundComponent(props: Props) {
	const {
		label = "Play sound",
		icon,
		labelPlaying = "Stop sound",
		iconPlaying,
		tooltip,
		href,
		autoplay = false,
		loop = false,
	} = props;

	const [loaded, setLoaded] = useState(false);
	const [playing, setPlaying] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const audioRef = useRef<HTMLAudioElement | null>(null);
	const handlersRef = useRef<{
		handleLoad: () => void;
		handlePlay: () => void;
		handlePause: () => void;
		handleError: () => void;
		handleEnded: () => void;
	} | null>(null);

	useEffect(() => {
		// Cleanup previous audio
		if (audioRef.current && handlersRef.current) {
			audioRef.current.pause();
			audioRef.current.removeEventListener(
				"loadeddata",
				handlersRef.current.handleLoad,
			);
			audioRef.current.removeEventListener(
				"play",
				handlersRef.current.handlePlay,
			);
			audioRef.current.removeEventListener(
				"pause",
				handlersRef.current.handlePause,
			);
			audioRef.current.removeEventListener(
				"error",
				handlersRef.current.handleError,
			);
			audioRef.current.removeEventListener(
				"ended",
				handlersRef.current.handleEnded,
			);
		}

		// Don't create audio if no href
		if (!href) {
			setLoaded(false);
			setPlaying(false);
			setError(null);
			audioRef.current = null;
			handlersRef.current = null;
			return;
		}

		// Reset state
		setLoaded(false);
		setPlaying(false);
		setError(null);

		// Create new audio element
		const audio = new Audio(href);

		// Event handlers
		const handlers = {
			handleLoad: () => {
				setLoaded(true);
				// Try autoplay when audio is loaded
				if (autoplay) {
					audio.play().catch((err) => {
						Logger.warn(
							"Autoplay failed (likely blocked by browser):",
							err,
						);
					});
				}
			},
			handlePlay: () => setPlaying(true),
			handlePause: () => setPlaying(false),
			handleError: () => {
				setError("Failed to load audio");
				setLoaded(false);
			},
			handleEnded: () => setPlaying(false),
		};

		// Store handlers for cleanup
		handlersRef.current = handlers;

		// Add event listeners
		audio.addEventListener("loadeddata", handlers.handleLoad);
		audio.addEventListener("play", handlers.handlePlay);
		audio.addEventListener("pause", handlers.handlePause);
		audio.addEventListener("error", handlers.handleError);
		audio.addEventListener("ended", handlers.handleEnded);

		// Set properties BEFORE loading
		audio.loop = loop;
		audio.preload = "metadata";
		// Note: Don't set audio.autoplay = true as it's unreliable

		// Load audio
		audio.load();
		audioRef.current = audio;

		// Cleanup function
		return () => {
			if (audioRef.current && handlersRef.current) {
				audioRef.current.pause();
				audioRef.current.removeEventListener(
					"loadeddata",
					handlersRef.current.handleLoad,
				);
				audioRef.current.removeEventListener(
					"play",
					handlersRef.current.handlePlay,
				);
				audioRef.current.removeEventListener(
					"pause",
					handlersRef.current.handlePause,
				);
				audioRef.current.removeEventListener(
					"error",
					handlersRef.current.handleError,
				);
				audioRef.current.removeEventListener(
					"ended",
					handlersRef.current.handleEnded,
				);
			}
			audioRef.current = null;
			handlersRef.current = null;
		};
	}, [href, autoplay, loop]);

	const onClick = useCallback(async () => {
		const audio = audioRef.current;
		if (audio && !error) {
			try {
				if (audio.paused) {
					await audio.play();
				} else {
					audio.pause();
				}
			} catch (err) {
				setError("Playback failed");
				Logger.error("Audio playback error:", err);
			}
		}
	}, [error]);

	return (
		<AppBuilderActionComponent
			label={playing ? labelPlaying : label}
			icon={playing ? iconPlaying : icon}
			tooltip={error ? `Error: ${error}` : tooltip}
			onClick={onClick}
			disabled={!loaded || !!error}
			canBeDisabledByParameter={false}
		/>
	);
}
