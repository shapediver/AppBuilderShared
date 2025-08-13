import AcceptRejectButtons from "@AppBuilderShared/components/shapediver/ui/AcceptRejectButtons";
import ParametersAndExportsAccordionComponent from "@AppBuilderShared/components/shapediver/ui/ParametersAndExportsAccordionComponent";
import Icon from "@AppBuilderShared/components/ui/Icon";
import TabsComponent, {
	ITabsComponentProps,
} from "@AppBuilderShared/components/ui/TabsComponent";
import {useSessionPropsExport} from "@AppBuilderShared/hooks/shapediver/parameters/useSessionPropsExport";
import {useSessionPropsParameter} from "@AppBuilderShared/hooks/shapediver/parameters/useSessionPropsParameter";
import {useSessions} from "@AppBuilderShared/hooks/shapediver/useSessions";
import {
	ISelectedModel,
	useModelSelectStore,
} from "@AppBuilderShared/store/useModelSelectStore";
import {IShapeDiverExampleModels} from "@AppBuilderShared/types/shapediver/examplemodel";
import {MultiSelect, Notification} from "@mantine/core";
import {IconAlertCircle} from "@tabler/icons-react";
import React, {useMemo} from "react";

interface Props {
	exampleModels: IShapeDiverExampleModels;
}

/**
 * Function that creates a select element in which models can be selected.
 * For each model select, a session is created.
 *
 * @returns
 */
export default function ModelSelect({exampleModels}: Props) {
	const {selectedModels, setSelectedModels} = useModelSelectStore(
		(state) => state,
	);
	const acceptRejectMode = true;

	useSessions(selectedModels);

	// callback to handle changes of the model selection
	const handleChange = (values: string[]) => {
		const selectedModels: ISelectedModel[] = values.map((v) => {
			return {
				...exampleModels[v],
				id: exampleModels[v].slug,
				name: v,
				acceptRejectMode,
				excludeViewports: ["viewport_1"],
			};
		});
		setSelectedModels(selectedModels);
	};

	// show a notification in case no models are selected
	const noModelsNotification = (
		<Notification
			icon={<Icon iconType={IconAlertCircle} />}
			mt="xs"
			title="Model Select"
			withCloseButton={false}
		>
			Select a model to see it in the viewport!
		</Notification>
	);

	// create parameter and export panels per model
	const namespaces = selectedModels.map((m) => m.slug);

	// get parameter and export props for all sessions
	const parameterProps = useSessionPropsParameter(namespaces);
	const exportProps = useSessionPropsExport(namespaces);

	const tabProps: ITabsComponentProps = useMemo(() => {
		return {
			defaultValue:
				selectedModels.length === 0 ? "" : selectedModels[0].slug,
			tabs: selectedModels.map((model) => {
				return {
					name: model.slug,
					children: [
						<ParametersAndExportsAccordionComponent
							key={0}
							parameters={parameterProps.filter(
								(p) => p.namespace === model.slug,
							)}
							exports={exportProps.filter(
								(p) => p.namespace === model.slug,
							)}
							topSection={
								<AcceptRejectButtons
									parameters={parameterProps}
								/>
							}
						/>,
					],
				};
			}),
		};
	}, [selectedModels, parameterProps, exportProps]);

	const tabs = <TabsComponent {...tabProps} />;

	return (
		<>
			<MultiSelect
				data={Object.keys(exampleModels)}
				label="Select models"
				placeholder="Pick the models you want to see"
				onChange={handleChange}
			/>
			{selectedModels.length === 0 && noModelsNotification}
			{selectedModels.length > 0 && tabs}
		</>
	);
}
