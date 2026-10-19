import {Logger} from "@AppBuilderLib/shared/lib/logger";
import {useCallback, useEffect, useRef, useState} from "react";
import {IAppBuilderLegacyActionPropsSound} from "../config/appbuilder";
import AppBuilderActionBase, {
	AppBuilderActionRenderProps,
} from "./AppBuilderActionBase";

type Props = IAppBuilderLegacyActionPropsSound & AppBuilderActionRenderProps;

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
		presentation,
		toolbarButtonProps,
		disabled,
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

		if (!href) {
			setLoaded(false);
			setPlaying(false);
			setError(null);
			audioRef.current = null;
			handlersRef.current = null;
			return;
		}

		setLoaded(false);
		setPlaying(false);
		setError(null);

		const audio = new Audio(href);
		const handlers = {
			handleLoad: () => {
				setLoaded(true);
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

		handlersRef.current = handlers;
		audio.addEventListener("loadeddata", handlers.handleLoad);
		audio.addEventListener("play", handlers.handlePlay);
		audio.addEventListener("pause", handlers.handlePause);
		audio.addEventListener("error", handlers.handleError);
		audio.addEventListener("ended", handlers.handleEnded);
		audio.loop = loop;
		audio.preload = "metadata";
		audio.load();
		audioRef.current = audio;

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

	const trigger = useCallback(async () => {
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
		<AppBuilderActionBase
			presentation={presentation}
			label={playing ? labelPlaying : label}
			icon={playing ? iconPlaying : icon}
			tooltip={error ? `Error: ${error}` : tooltip}
			onClick={() => void trigger()}
			disabled={disabled || !loaded || !!error}
			canBeDisabledByParameter={false}
			toolbarButtonProps={toolbarButtonProps}
		/>
	);
}
