import {useEffect} from "react";
import classes from "./AppBuilderAgentFrame.module.css";

type Props = {
	src: string;
	onPeerWindow: (peer: Window | null) => void;
};

export default function AppBuilderAgentFrame({src, onPeerWindow}: Props) {
	useEffect(() => {
		return () => onPeerWindow(null);
	}, [onPeerWindow]);

	return (
		<iframe
			className={classes.iframe}
			src={src}
			title="ShapeDiver agent"
			onLoad={(event) => {
				onPeerWindow(event.currentTarget.contentWindow);
			}}
		/>
	);
}
