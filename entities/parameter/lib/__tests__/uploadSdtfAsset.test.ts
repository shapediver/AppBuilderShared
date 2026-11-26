/**
 * @jest-environment jsdom
 */
import {
	createSdtfUploadCache,
	formatSdtfParameterValue,
	sdtfUploadKey,
} from "../uploadSdtfAsset";

describe("uploadSdtfAsset", () => {
	const originalFetch = globalThis.fetch;

	afterEach(() => {
		globalThis.fetch = originalFetch;
	});

	it("formats an asset id with and without a chunk", () => {
		expect(formatSdtfParameterValue("asset-1")).toEqual(
			JSON.stringify({asset: {id: "asset-1"}}, null, 2),
		);
		expect(formatSdtfParameterValue("asset-1", {name: "Mesh"})).toEqual(
			JSON.stringify(
				{asset: {id: "asset-1", chunk: {name: "Mesh"}}},
				null,
				2,
			),
		);
	});

	it("downloads and uploads once for the same session and url", async () => {
		const uploadSDTF = jest.fn(async () => [{id: "asset-1"}]);
		globalThis.fetch = jest.fn(async () => ({
			arrayBuffer: async () => new ArrayBuffer(4),
		})) as unknown as typeof fetch;
		const onUploadStart = jest.fn();
		const cache = createSdtfUploadCache();

		const first = cache.uploadAsset({
			uploadNamespace: "session-a",
			url: "https://example.test/out.sdtf",
			session: {uploadSDTF},
			onUploadStart,
		});
		const second = cache.uploadAsset({
			uploadNamespace: "session-a",
			url: "https://example.test/out.sdtf",
			session: {uploadSDTF},
			onUploadStart,
		});

		await expect(Promise.all([first, second])).resolves.toEqual([
			"asset-1",
			"asset-1",
		]);
		expect(globalThis.fetch).toHaveBeenCalledTimes(1);
		expect(uploadSDTF).toHaveBeenCalledTimes(1);
		expect(onUploadStart).toHaveBeenCalledTimes(1);
		expect(onUploadStart.mock.calls[0][1]).toBe(
			sdtfUploadKey("session-a", "https://example.test/out.sdtf"),
		);
	});

	it("keeps uploads separate when a session id contains a pipe", async () => {
		const uploadA = jest.fn(async () => [{id: "asset-a"}]);
		const uploadB = jest.fn(async () => [{id: "asset-b"}]);
		globalThis.fetch = jest.fn(async () => ({
			arrayBuffer: async () => new ArrayBuffer(4),
		})) as unknown as typeof fetch;
		const cache = createSdtfUploadCache();

		const [idA, idB] = await Promise.all([
			cache.uploadAsset({
				uploadNamespace: "session|a",
				url: "https://example.test/out.sdtf",
				session: {uploadSDTF: uploadA},
			}),
			cache.uploadAsset({
				uploadNamespace: "session",
				url: "a|https://example.test/out.sdtf",
				session: {uploadSDTF: uploadB},
			}),
		]);

		expect(idA).toBe("asset-a");
		expect(idB).toBe("asset-b");
		expect(uploadA).toHaveBeenCalledTimes(1);
		expect(uploadB).toHaveBeenCalledTimes(1);
		expect(globalThis.fetch).toHaveBeenCalledTimes(2);
	});

	it("uploads once per target session for the same url", async () => {
		const uploadA = jest.fn(async () => [{id: "asset-a"}]);
		const uploadB = jest.fn(async () => [{id: "asset-b"}]);
		globalThis.fetch = jest.fn(async () => ({
			arrayBuffer: async () => new ArrayBuffer(4),
		})) as unknown as typeof fetch;
		const cache = createSdtfUploadCache();

		const [idA, idB] = await Promise.all([
			cache.uploadAsset({
				uploadNamespace: "session-a",
				url: "https://example.test/out.sdtf",
				session: {uploadSDTF: uploadA},
			}),
			cache.uploadAsset({
				uploadNamespace: "session-b",
				url: "https://example.test/out.sdtf",
				session: {uploadSDTF: uploadB},
			}),
		]);

		expect(idA).toBe("asset-a");
		expect(idB).toBe("asset-b");
		expect(uploadA).toHaveBeenCalledTimes(1);
		expect(uploadB).toHaveBeenCalledTimes(1);
		expect(globalThis.fetch).toHaveBeenCalledTimes(2);
	});

	it("returns undefined when the upload fails", async () => {
		globalThis.fetch = jest.fn(async () => ({
			arrayBuffer: async () => new ArrayBuffer(4),
		})) as unknown as typeof fetch;
		const cache = createSdtfUploadCache();

		const first = cache.uploadAsset({
			uploadNamespace: "session-a",
			url: "https://example.test/out.sdtf",
			session: {
				uploadSDTF: jest.fn(async () => {
					throw new Error("upload failed");
				}),
			},
		});
		const second = cache.uploadAsset({
			uploadNamespace: "session-a",
			url: "https://example.test/out.sdtf",
			session: {
				uploadSDTF: jest.fn(async () => [{id: "unused"}]),
			},
		});

		await expect(Promise.all([first, second])).resolves.toEqual([
			undefined,
			undefined,
		]);
	});
});
