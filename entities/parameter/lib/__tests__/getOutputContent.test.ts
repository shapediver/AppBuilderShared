/**
 * @jest-environment jsdom
 */
import {useShapeDiverStoreParameters} from "../../model/useShapeDiverStoreParameters";
import {getOutputContent} from "../getOutputContent";

describe("getOutputContent", () => {
	it("returns found false when the output is missing", () => {
		expect(getOutputContent("session", "missing")).toEqual({
			found: false,
		});
	});

	it("returns content when the output exists", () => {
		const original = useShapeDiverStoreParameters.getState();
		const content = [{href: "https://example.com"}];
		useShapeDiverStoreParameters.setState({
			getOutput: () =>
				({
					getState: () => ({content}),
				}) as never,
		});
		try {
			expect(getOutputContent("session", "AgentMetric")).toEqual({
				found: true,
				content,
			});
		} finally {
			useShapeDiverStoreParameters.setState({
				getOutput: original.getOutput,
			});
		}
	});
});
