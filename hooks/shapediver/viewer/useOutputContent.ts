import {useOutput} from "@AppBuilderShared/hooks/shapediver/viewer/useOutput";
import {
	EVENTTYPE_OUTPUT,
	IOutputApi,
	IOutputEvent,
	ShapeDiverResponseOutputContent,
	addListener,
	removeListener,
} from "@shapediver/viewer.session";
import {useEffect, useState} from "react";

/**
 * Hook providing access to outputs by id or name,
 * and providing the resulting content of the output.
 *
 * @see https://viewer.shapediver.com/v3/latest/api/interfaces/IOutputApi.html
 *
 * Makes use of {@link useOutput}.
 *
 * @param sessionId
 * @param outputIdOrName
 * @returns
 */
export function useOutputContent(
	sessionId: string,
	outputIdOrName: string,
): {
	/**
	 * API of the output
	 * @see https://viewer.shapediver.com/v3/latest/api/interfaces/IOutputApi.html
	 */
	outputApi: IOutputApi | undefined;
	/**
	 * Scene tree node of the output
	 * @see https://viewer.shapediver.com/v3/latest/api/interfaces/IOutputApi.html#node
	 */
	outputContent: ShapeDiverResponseOutputContent[] | undefined;
} {
	const {outputApi} = useOutput(sessionId, outputIdOrName);

	const [content, setContent] = useState<
		ShapeDiverResponseOutputContent[] | undefined
	>(outputApi?.content);

	// register an event handler and listen for output updates
	useEffect(() => {
		const token = addListener(EVENTTYPE_OUTPUT.OUTPUT_UPDATED, (e) => {
			const event = e as IOutputEvent;
			if (event.outputId !== outputApi?.id) return;
			if (content !== outputApi?.content) setContent(outputApi?.content);
		});

		setContent(outputApi?.content);

		return () => {
			removeListener(token);
		};
	}, [outputApi]);

	return {
		outputApi,
		outputContent: content,
	};
}
