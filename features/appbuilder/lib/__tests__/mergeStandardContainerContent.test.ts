import {AppBuilderContainerNameType} from "@AppBuilderLib/features/appbuilder/config/appbuilder";
import {createElement} from "react";
import {mergeStandardContainerContent} from "../mergeStandardContainerContent";

const item = (id: string) => createElement("div", {key: id, "data-id": id});

describe("mergeStandardContainerContent", () => {
	it("appends additional items after native widgets by default", () => {
		const result = mergeStandardContainerContent(
			AppBuilderContainerNameType.Bottom,
			{
				name: AppBuilderContainerNameType.Bottom,
				widgets: [{type: "text", props: {text: "native"}}],
			},
			{
				a: {content: item("extra")},
			},
			0,
		);

		expect(result?.widgets).toHaveLength(2);
		expect(result?.widgets?.[0]).toEqual({
			type: "text",
			props: {text: "native"},
		});
		expect(result?.widgets?.[1]).toBeDefined();
	});

	it("prepends items with position before", () => {
		const result = mergeStandardContainerContent(
			AppBuilderContainerNameType.Bottom,
			{
				name: AppBuilderContainerNameType.Bottom,
				widgets: [{type: "text", props: {text: "native"}}],
			},
			{
				a: {content: item("before"), position: "before"},
			},
			0,
		);

		expect(result?.widgets).toHaveLength(2);
		expect(result?.widgets?.[1]).toEqual({
			type: "text",
			props: {text: "native"},
		});
	});

	it("orders additional items with the same position by order then insertion", () => {
		const result = mergeStandardContainerContent(
			AppBuilderContainerNameType.Bottom,
			{
				name: AppBuilderContainerNameType.Bottom,
				widgets: [{type: "text", props: {text: "native"}}],
			},
			{
				first: {content: item("first"), order: 1},
				second: {content: item("second"), order: 0},
			},
			0,
		);

		expect(result?.widgets).toHaveLength(3);
		expect(
			(result?.widgets?.[1] as {props?: {["data-id"]?: string}}).props?.[
				"data-id"
			],
		).toBe("second");
		expect(
			(result?.widgets?.[2] as {props?: {["data-id"]?: string}}).props?.[
				"data-id"
			],
		).toBe("first");
	});

	it("merges additional items into the active tab when tabs exist", () => {
		const result = mergeStandardContainerContent(
			AppBuilderContainerNameType.Right,
			{
				name: AppBuilderContainerNameType.Right,
				tabs: [
					{
						name: "One",
						widgets: [{type: "text", props: {text: "tab"}}],
					},
				],
			},
			{
				a: {content: item("extra")},
			},
			0,
		);

		expect(result?.tabs?.[0].widgets).toHaveLength(2);
		expect(result?.widgets).toEqual([]);
	});
});
