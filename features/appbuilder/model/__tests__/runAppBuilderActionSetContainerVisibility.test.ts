/**
 * @jest-environment jsdom
 */
import {useShapeDiverStoreViewportAnchors} from "@AppBuilderLib/entities/viewport-anchor/model/useShapeDiverStoreViewportAnchors";
import {useViewportAnchorTriggerRegistry} from "@AppBuilderLib/entities/viewport-anchor/model/useViewportAnchorTriggerRegistry";
import {AppBuilderContainerNameType} from "@AppBuilderLib/features/appbuilder/config/appbuilder";
import {useShapeDiverStoreStandardContainers} from "@AppBuilderLib/features/appbuilder/model/useShapeDiverStoreStandardContainers";
import {useShapeDiverStoreToolbars} from "@AppBuilderLib/features/appbuilder/model/useShapeDiverStoreToolbars";
import {runAppBuilderActionSetContainerVisibility} from "../runAppBuilderActionSetContainerVisibility";
import {useActionClickSourceStore} from "../useActionClickSourceStore";

const viewportId = "viewport-1";

function seed(
	anchors: {
		id: string;
		showContent: boolean;
		type?: AppBuilderContainerNameType;
	}[],
) {
	useShapeDiverStoreViewportAnchors.setState({
		anchors: {
			[viewportId]: anchors.map((anchor) => ({
				type: anchor.type ?? AppBuilderContainerNameType.Anchor2d,
				id: anchor.id,
				showContent: anchor.showContent,
				hideable: true,
				exclusive: false,
			})),
		},
	});
}

function showContent(id: string) {
	return useShapeDiverStoreViewportAnchors
		.getState()
		.anchors[viewportId].find((anchor) => anchor.id === id)?.showContent;
}

describe("runAppBuilderActionSetContainerVisibility click source", () => {
	const button = document.createElement("button");

	beforeEach(() => {
		useViewportAnchorTriggerRegistry.setState({triggers: {}});
		useActionClickSourceStore.setState({source: null, token: 0});
		seed([
			{id: "panel-a", showContent: false},
			{id: "panel-b", showContent: true},
			{id: "panel-c", showContent: true},
		]);
		useShapeDiverStoreStandardContainers.setState({
			containerOpen: {
				left: true,
				right: false,
				top: false,
				bottom: false,
			},
		});
		useShapeDiverStoreToolbars.setState({
			toolbarOpen: {
				"test-toolbar": true,
			},
		});
	});

	it("controls standard containers visibility", () => {
		runAppBuilderActionSetContainerVisibility({
			container: {
				name: AppBuilderContainerNameType.Right,
			},
			mode: "toggle",
			viewportId,
		});

		expect(
			useShapeDiverStoreStandardContainers.getState().containerOpen.right,
		).toBe(true);
	});

	it("controls 2d viewport anchor visibility", () => {
		runAppBuilderActionSetContainerVisibility({
			container: {
				name: AppBuilderContainerNameType.Anchor2d,
				props: {id: "panel-a"},
			},
			mode: "toggle",
			viewportId,
		});

		expect(showContent("panel-a")).toBe(true);
	});

	it("controls 3d viewport anchor visibility", () => {
		seed([
			{
				id: "panel-a",
				showContent: false,
				type: AppBuilderContainerNameType.Anchor3d,
			},
		]);

		runAppBuilderActionSetContainerVisibility({
			container: {
				name: AppBuilderContainerNameType.Anchor3d,
				props: {id: "panel-a"},
			},
			mode: "toggle",
			viewportId,
		});

		expect(showContent("panel-a")).toBe(true);
	});

	it("controls toolbar visibility", () => {
		runAppBuilderActionSetContainerVisibility({
			container: {
				name: AppBuilderContainerNameType.Toolbar,
				props: {id: "test-toolbar"},
			},
			mode: "toggle",
			viewportId,
		});

		expect(
			useShapeDiverStoreToolbars.getState().toolbarOpen["test-toolbar"],
		).toBe(false);
	});

	it("only toggles visibility when no action button published a click", () => {
		runAppBuilderActionSetContainerVisibility({
			container: {
				name: AppBuilderContainerNameType.Anchor2d,
				props: {id: "panel-a"},
			},
			mode: "open",
			viewportId,
		});

		expect(showContent("panel-a")).toBe(true);
		expect(showContent("panel-b")).toBe(true);
		expect(
			useViewportAnchorTriggerRegistry.getState().triggers["panel-a"],
		).toBeUndefined();
	});

	it("docks a single action's 2d anchor and closes siblings", () => {
		useActionClickSourceStore.getState().beginActionClick({
			element: button,
			exclusiveContainers: true,
			siblingAnchorIds: ["panel-a", "panel-b", "panel-c"],
		});

		runAppBuilderActionSetContainerVisibility({
			container: {
				name: AppBuilderContainerNameType.Anchor2d,
				props: {id: "panel-a"},
			},
			mode: "open",
			viewportId,
		});

		expect(
			useViewportAnchorTriggerRegistry.getState().triggers["panel-a"],
		).toBe(button);
		expect(showContent("panel-a")).toBe(true);
		expect(showContent("panel-b")).toBe(false);
		expect(showContent("panel-c")).toBe(false);
	});

	it("keeps every anchor the executeActions sequence will open", () => {
		useActionClickSourceStore.getState().beginActionClick({
			element: button,
			exclusiveContainers: true,
			siblingAnchorIds: ["panel-a", "panel-b", "panel-c"],
			actions: [
				{
					type: "setContainerVisibility",
					props: {
						container: {
							name: AppBuilderContainerNameType.Anchor2d,
							props: {id: "panel-a"},
						},
						mode: "open",
					},
				},
				{
					type: "setContainerVisibility",
					props: {
						container: {
							name: AppBuilderContainerNameType.Anchor2d,
							props: {id: "panel-b"},
						},
						mode: "open",
					},
				},
			],
		});

		runAppBuilderActionSetContainerVisibility({
			container: {
				name: AppBuilderContainerNameType.Anchor2d,
				props: {id: "panel-a"},
			},
			mode: "open",
			viewportId,
		});

		expect(showContent("panel-a")).toBe(true);
		expect(showContent("panel-b")).toBe(true);
		expect(showContent("panel-c")).toBe(false);
	});

	it("does not close siblings when a toggle would hide the panel", () => {
		seed([
			{id: "panel-a", showContent: true},
			{id: "panel-b", showContent: true},
		]);
		useActionClickSourceStore.getState().beginActionClick({
			element: button,
			exclusiveContainers: true,
			siblingAnchorIds: ["panel-a", "panel-b"],
		});

		runAppBuilderActionSetContainerVisibility({
			container: {
				name: AppBuilderContainerNameType.Anchor2d,
				props: {id: "panel-a"},
			},
			mode: "toggle",
			viewportId,
		});

		expect(showContent("panel-a")).toBe(false);
		expect(showContent("panel-b")).toBe(true);
	});

	it("leaves siblings open when the toolbar is not exclusive", () => {
		useActionClickSourceStore.getState().beginActionClick({
			element: button,
			exclusiveContainers: false,
			siblingAnchorIds: ["panel-a", "panel-b"],
		});

		runAppBuilderActionSetContainerVisibility({
			container: {
				name: AppBuilderContainerNameType.Anchor2d,
				props: {id: "panel-a"},
			},
			mode: "open",
			viewportId,
		});

		expect(showContent("panel-b")).toBe(true);
		expect(
			useViewportAnchorTriggerRegistry.getState().triggers["panel-a"],
		).toBe(button);
	});

	it("closes siblings for a 3d anchor without registering a 2d trigger", () => {
		seed([
			{
				id: "panel-a",
				showContent: false,
				type: AppBuilderContainerNameType.Anchor3d,
			},
			{id: "panel-b", showContent: true},
		]);
		useActionClickSourceStore.getState().beginActionClick({
			element: button,
			exclusiveContainers: true,
			siblingAnchorIds: ["panel-a", "panel-b"],
		});

		runAppBuilderActionSetContainerVisibility({
			container: {
				name: AppBuilderContainerNameType.Anchor3d,
				props: {id: "panel-a"},
			},
			mode: "open",
			viewportId,
		});

		expect(showContent("panel-a")).toBe(true);
		expect(showContent("panel-b")).toBe(false);
		expect(
			useViewportAnchorTriggerRegistry.getState().triggers["panel-a"],
		).toBeUndefined();
	});

	it("keeps an anchor a later toggle in the same sequence opens", () => {
		seed([
			{id: "panel-a", showContent: false},
			{id: "panel-b", showContent: false},
			{id: "panel-c", showContent: true},
		]);
		const actions = ["panel-a", "panel-b"].map((id) => ({
			type: "setContainerVisibility",
			props: {
				container: {
					name: AppBuilderContainerNameType.Anchor2d,
					props: {id},
				},
				mode: "toggle" as const,
			},
		}));
		useActionClickSourceStore.getState().beginActionClick({
			element: button,
			exclusiveContainers: true,
			siblingAnchorIds: ["panel-a", "panel-b", "panel-c"],
			actions,
		});

		for (const id of ["panel-a", "panel-b"]) {
			runAppBuilderActionSetContainerVisibility({
				container: {
					name: AppBuilderContainerNameType.Anchor2d,
					props: {id},
				},
				mode: "toggle",
				viewportId,
			});
		}

		expect(showContent("panel-a")).toBe(true);
		expect(showContent("panel-b")).toBe(true);
		expect(showContent("panel-c")).toBe(false);
	});

	it("ignores the click when the sequence does not target this anchor", () => {
		useActionClickSourceStore.getState().beginActionClick({
			element: button,
			exclusiveContainers: true,
			siblingAnchorIds: ["panel-a", "panel-b", "panel-c"],
			actions: [
				{
					type: "setContainerVisibility",
					props: {
						container: {
							name: AppBuilderContainerNameType.Anchor2d,
							props: {id: "panel-a"},
						},
						mode: "open",
					},
				},
			],
		});

		runAppBuilderActionSetContainerVisibility({
			container: {
				name: AppBuilderContainerNameType.Anchor2d,
				props: {id: "panel-c"},
			},
			mode: "open",
			viewportId,
		});

		expect(showContent("panel-b")).toBe(true);
		expect(showContent("panel-c")).toBe(true);
		expect(
			useViewportAnchorTriggerRegistry.getState().triggers["panel-c"],
		).toBeUndefined();
	});
});
