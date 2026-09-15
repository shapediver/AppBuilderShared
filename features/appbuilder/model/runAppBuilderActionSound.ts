import {IAppBuilderActionPropsSound} from "@AppBuilderLib/features/appbuilder/config/appbuilder";

/** Play the sound at `href` once. */
export async function runAppBuilderActionSound(
	props: IAppBuilderActionPropsSound,
): Promise<void> {
	if (!props.href) return;
	const audio = new Audio(props.href);
	await audio.play();
}
