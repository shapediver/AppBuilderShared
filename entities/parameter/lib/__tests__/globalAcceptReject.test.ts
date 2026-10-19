/**
 * @jest-environment jsdom
 */
import {
	globalPendingParameterIds,
	hasGlobalPendingParameterChanges,
	registerInlineAcceptRejectParameter,
} from "../globalAcceptReject";

describe("globalAcceptReject", () => {
	it("leaves inline parameters out of the shared accept/reject queue", () => {
		const unregister = registerInlineAcceptRejectParameter(
			"session",
			"Length",
		);

		try {
			expect(
				globalPendingParameterIds("session", {
					Length: 2,
					Width: 4,
				}),
			).toEqual(["Width"]);
			expect(
				hasGlobalPendingParameterChanges({
					session: {
						values: {Length: 2},
					} as never,
				}),
			).toBe(false);
			expect(
				hasGlobalPendingParameterChanges({
					session: {
						values: {Length: 2, Width: 4},
					} as never,
				}),
			).toBe(true);
		} finally {
			unregister();
		}

		expect(
			globalPendingParameterIds("session", {Length: 2, Width: 4}),
		).toEqual(["Length", "Width"]);
	});
});
