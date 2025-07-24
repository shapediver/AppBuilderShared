import AppBuilderContainerComponent from "@AppBuilderShared/components/shapediver/appbuilder/AppBuilderContainerComponent";
import ViewportAnchor from "@AppBuilderShared/components/shapediver/viewport/ViewportAnchor";
import {
	IAppBuilderContainer,
	isAnchor3dContainer,
} from "@AppBuilderShared/types/shapediver/appbuilder";
import React, {useEffect, useState} from "react";

interface Props {
	namespace: string;
	containers: IAppBuilderContainer[] | undefined;
}

/**
 * Custom hook to generate viewport anchors from app builder containers.
 *
 * @param props - The properties containing namespace and containers.
 * @returns An array of JSX elements representing the viewport anchors.
 */
export function useViewportAnchors(props: Props): JSX.Element[] {
	const {namespace, containers} = props;

	const [anchors, setAnchors] = useState<JSX.Element[]>([]);

	useEffect(() => {
		const anchors: JSX.Element[] = [];
		containers?.forEach((container) => {
			if (isAnchor3dContainer(container)) {
				anchors.push(
					<ViewportAnchor
						key={JSON.stringify(container)}
						id={container.props.id}
						location={container.props.location}
						justification={container.props.justification}
						allowPointerEvents={
							container.props.allowPointerEvents ?? true
						}
						element={
							<AppBuilderContainerComponent
								namespace={namespace}
								{...container}
							/>
						}
						previewIcon={container.props.previewIcon}
					/>,
				);
			}
		});
		setAnchors(anchors);
	}, [containers, props.namespace]);

	return anchors;
}
