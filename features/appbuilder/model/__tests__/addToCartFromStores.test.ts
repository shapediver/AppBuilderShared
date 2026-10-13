/**
 * @jest-environment jsdom
 */
import {addToCartFromStores} from "@AppBuilderLib/features/appbuilder/model/runAppBuilderActionAddToCart";
import {createModelStateFromStores} from "@AppBuilderLib/features/appbuilder/model/runAppBuilderActionCreateModelState";
import {ECommerceApiSingleton} from "@AppBuilderLib/features/ecommerce/api/singleton";

jest.mock(
	"@AppBuilderLib/features/appbuilder/model/runAppBuilderActionCreateModelState",
	() => ({
		createModelStateFromStores: jest.fn(),
	}),
);

jest.mock("@AppBuilderLib/features/ecommerce/api/singleton", () => ({
	ECommerceApiSingleton: Promise.resolve({
		addItemToCart: jest.fn(),
	}),
}));

describe("addToCartFromStores", () => {
	it("does not call the plugin when model state creation returns no id", async () => {
		jest.mocked(createModelStateFromStores).mockResolvedValue({});
		const api = await ECommerceApiSingleton;

		await expect(
			addToCartFromStores(
				{},
				{namespace: "ns", viewportId: "viewport_1"},
			),
		).rejects.toThrow("Failed to create model state.");
		expect(api.addItemToCart).not.toHaveBeenCalled();
	});
});
