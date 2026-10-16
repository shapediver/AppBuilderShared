/**
 * @jest-environment jsdom
 */
import {useViewportAnchorTriggerRegistry} from "@AppBuilderLib/entities/viewport-anchor/model/useViewportAnchorTriggerRegistry";
import {
	bindActionClickTrigger,
	clearActionClickExclusivity,
	consumeActionClickExclusivity,
	noteActionClickExclusivity,
	releaseActionClickTriggers,
	useActionClickSourceStore,
} from "../useActionClickSourceStore";

describe("useActionClickSourceStore", () => {
	beforeEach(() => {
		useActionClickSourceStore.setState({
			source: null,
			clicks: {},
			token: 0,
		});
		useViewportAnchorTriggerRegistry.setState({triggers: {}});
		clearActionClickExclusivity();
	});

	it("gives the toolbar exclusivity note to one action click", () => {
		noteActionClickExclusivity({
			exclusiveContainers: true,
			siblingAnchorIds: ["panel-a"],
		});

		expect(consumeActionClickExclusivity()).toEqual({
			exclusiveContainers: true,
			siblingAnchorIds: ["panel-a"],
		});
		expect(consumeActionClickExclusivity()).toBeNull();
	});

	it("keeps a newer click when an older one ends", () => {
		const first = document.createElement("button");
		const second = document.createElement("button");
		const firstToken = useActionClickSourceStore
			.getState()
			.beginActionClick({
				element: first,
				exclusiveContainers: true,
				siblingAnchorIds: ["panel-a"],
			});
		const secondToken = useActionClickSourceStore
			.getState()
			.beginActionClick({
				element: second,
				exclusiveContainers: false,
				siblingAnchorIds: ["panel-b"],
			});

		useActionClickSourceStore.getState().endActionClick(firstToken);

		expect(useActionClickSourceStore.getState().source?.element).toBe(
			second,
		);
		useActionClickSourceStore.getState().endActionClick(secondToken);
		expect(useActionClickSourceStore.getState().source).toBeNull();
	});

	it("restores the earlier click when a later one ends", () => {
		const first = document.createElement("button");
		const second = document.createElement("button");
		const firstToken = useActionClickSourceStore
			.getState()
			.beginActionClick({
				element: first,
				exclusiveContainers: true,
				siblingAnchorIds: ["panel-a"],
			});
		const secondToken = useActionClickSourceStore
			.getState()
			.beginActionClick({
				element: second,
				exclusiveContainers: false,
				siblingAnchorIds: ["panel-b"],
			});

		useActionClickSourceStore.getState().endActionClick(secondToken);

		expect(useActionClickSourceStore.getState().source?.element).toBe(
			first,
		);
		expect(
			useActionClickSourceStore.getState().clicks[firstToken]?.element,
		).toBe(first);
	});

	it("clears only the triggers bound to that button", () => {
		const button = document.createElement("button");
		const other = document.createElement("button");
		bindActionClickTrigger(button, "panel-a");
		useViewportAnchorTriggerRegistry
			.getState()
			.setTrigger("panel-b", other);

		releaseActionClickTriggers(button);

		expect(
			useViewportAnchorTriggerRegistry.getState().triggers["panel-a"],
		).toBeNull();
		expect(
			useViewportAnchorTriggerRegistry.getState().triggers["panel-b"],
		).toBe(other);
	});
});
