import {executeActionsSuccessResult} from "@AppBuilderLib/features/ecommerce/lib/executeActionsSuccessResult";

describe("executeActionsSuccessResult", () => {
	it("keeps nested replies in order", () => {
		const results = [
			{success: true as const},
			{
				success: true as const,
				props: {modelStateId: "ms-1", cartItemId: "cart-1"},
			},
		];

		expect(executeActionsSuccessResult(results)).toEqual({
			success: true,
			props: {results},
		});
	});
});
