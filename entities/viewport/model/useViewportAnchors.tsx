import {
	AppBuilderContainerNameType,
	ComponentContext,
	IAppBuilderContainer,
	isAnchor2dContainer,
	isAnchor3dContainer,
} from "@AppBuilderLib/features/appbuilder";
import {Logger} from "@AppBuilderLib/shared/lib";
import React, {useContext, useEffect, useState} from "react";

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

	const componentContext = useContext(ComponentContext);

	useEffect(() => {
		const ContainerComponent = componentContext.containerComponent;
		const anchors: JSX.Element[] = [];

		const existingIds = new Set<string>();
		containers?.forEach((container) => {
			if (isAnchor3dContainer(container)) {
				// check if there are anchors with the same id
				if (existingIds.has(container.props.id)) {
					Logger.warn(
						`Duplicate anchor id found: ${container.props.id}. Anchor ids must be unique, skipping anchor.`,
					);
					return;
				} else {
					existingIds.add(container.props.id);
				}

				const ViewportAnchor3d =
					componentContext.viewportAnchors?.[
						AppBuilderContainerNameType.Anchor3d
					];

				if (!ViewportAnchor3d) {
					Logger.warn(
						`No ViewportAnchor3d component registered in ComponentContext, cannot render 3D anchor with id: ${container.props.id}.`,
					);
					return;
				}

				if (!ContainerComponent) {
					Logger.warn(
						`No containerComponent registered in ComponentContext, cannot render 3D anchor with id: ${container.props.id}.`,
					);
					return;
				}

				anchors.push(
					<ViewportAnchor3d.component
						key={JSON.stringify(container)}
						id={container.props.id}
						location={container.props.location}
						justification={container.props.justification}
						allowPointerEvents={
							container.props.allowPointerEvents ?? true
						}
						element={
							<ContainerComponent
								namespace={namespace}
								{...container}
							/>
						}
						previewIcon={container.props.previewIcon}
						width={container.props.width}
						height={container.props.height}
						maxWidth={container.props.maxWidth}
						maxHeight={container.props.maxHeight}
						mobileFallback={container.props.mobileFallback}
						useContainer={container.props.useContainer ?? true}
						closingStrategy={"emptyClick"}
						useCloseButton={container.props.useCloseButton}
						hideable={container.props.hideable}
						selectionProperties={
							container.props.selectionProperties
						}
					/>,
				);
			} else if (isAnchor2dContainer(container)) {
				// check if there are anchors with the same id
				if (existingIds.has(container.props.id)) {
					Logger.warn(
						`Duplicate anchor id found: ${container.props.id}. Anchor ids must be unique, skipping anchor.`,
					);
					return;
				} else {
					existingIds.add(container.props.id);
				}

				const ViewportAnchor2d =
					componentContext.viewportAnchors?.[
						AppBuilderContainerNameType.Anchor2d
					];

				if (!ViewportAnchor2d) {
					Logger.warn(
						`No ViewportAnchor2d component registered in ComponentContext, cannot render 2D anchor with id: ${container.props.id}.`,
					);
					return;
				}

				if (!ContainerComponent) {
					Logger.warn(
						`No containerComponent registered in ComponentContext, cannot render 2D anchor with id: ${container.props.id}.`,
					);
					return;
				}

				anchors.push(
					<ViewportAnchor2d.component
						key={JSON.stringify(container)}
						id={container.props.id}
						location={container.props.location}
						justification={container.props.justification}
						allowPointerEvents={
							container.props.allowPointerEvents ?? true
						}
						element={
							<ContainerComponent
								namespace={namespace}
								{...container}
							/>
						}
						previewIcon={container.props.previewIcon}
						draggable={container.props.draggable}
						width={container.props.width}
						height={container.props.height}
						maxWidth={container.props.maxWidth}
						maxHeight={container.props.maxHeight}
						mobileFallback={container.props.mobileFallback}
						useContainer={container.props.useContainer ?? true}
						closingStrategy={"button"}
						selectionProperties={
							container.props.selectionProperties
						}
					/>,
				);
			}
		});
		setAnchors(anchors);
	}, [componentContext, containers, props.namespace]);

	return anchors;
}
