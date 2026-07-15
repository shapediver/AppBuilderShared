import {
	AppBuilderContainerNameType,
	IAppBuilder,
} from "../../config/appbuilder";
import {getUiParameterRefs} from "../appbuilder";

function minimalAppBuilder(containers: IAppBuilder["containers"]): IAppBuilder {
	return {
		version: "1.0",
		containers,
	};
}

describe("getUiParameterRefs", () => {
	it("collects refs from accordion widgets in containers and tabs", () => {
		const data = minimalAppBuilder([
			{
				name: AppBuilderContainerNameType.Left,
				widgets: [
					{
						type: "accordion",
						props: {parameters: [{name: "width"}]},
					},
				],
				tabs: [
					{
						name: "Tab 1",
						widgets: [
							{
								type: "accordion",
								props: {parameters: [{name: "height"}]},
							},
						],
					},
				],
			},
		]);

		expect(getUiParameterRefs(data).map((ref) => ref.name)).toEqual([
			"width",
			"height",
		]);
	});

	it("collects refs from form parameters and parameter controls", () => {
		const data = minimalAppBuilder([
			{
				name: AppBuilderContainerNameType.Left,
				widgets: [
					{
						type: "form",
						props: {
							parameters: [{name: "form-param"}],
							controls: [
								{
									type: "parameter",
									props: {name: "control-param"},
								},
								{type: "export", props: {name: "some-export"}},
							],
						},
					},
				],
			},
		]);

		expect(getUiParameterRefs(data).map((ref) => ref.name)).toEqual([
			"form-param",
			"control-param",
		]);
	});

	it("collects refs from controls widgets", () => {
		const data = minimalAppBuilder([
			{
				name: AppBuilderContainerNameType.Right,
				widgets: [
					{
						type: "controls",
						props: {
							controls: [
								{
									type: "parameter",
									props: {
										name: "slider",
										sessionId: "session-a",
									},
								},
							],
						},
					},
				],
			},
		]);

		expect(getUiParameterRefs(data)).toEqual([
			{name: "slider", sessionId: "session-a"},
		]);
	});

	it("collects refs from widgets nested in stackUi", () => {
		const data = minimalAppBuilder([
			{
				name: AppBuilderContainerNameType.Left,
				widgets: [
					{
						type: "stackUi",
						props: {
							name: "Options",
							widgets: [
								{
									type: "controls",
									props: {
										controls: [
											{
												type: "parameter",
												props: {name: "nested-slider"},
											},
										],
									},
								},
							],
						},
					},
				],
			},
		]);

		expect(getUiParameterRefs(data).map((ref) => ref.name)).toEqual([
			"nested-slider",
		]);
	});

	it("collects refs from widgets nested in accordionUi", () => {
		const data = minimalAppBuilder([
			{
				name: AppBuilderContainerNameType.Left,
				widgets: [
					{
						type: "accordionUi",
						props: {
							items: [
								{
									name: "Section",
									widgets: [
										{
											type: "accordion",
											props: {
												parameters: [{name: "depth"}],
											},
										},
									],
								},
							],
						},
					},
				],
			},
		]);

		expect(getUiParameterRefs(data).map((ref) => ref.name)).toEqual([
			"depth",
		]);
	});
});
