import {isRunningInPlatform} from "@AppBuilderShared/utils/platform/environment";
import {ECommerceApiSingleton} from "./singleton";
import {
	IScrollingApi,
	IScrollingApiFactory,
	IScrollingApiItemTypeSelect,
} from "./types/scrollingapi";

export class DummyScrollingApiSelect
	implements IScrollingApi<IScrollingApiItemTypeSelect>
{
	private _dummyItems: IScrollingApiItemTypeSelect[] = [];
	private _filteredDummyItems: IScrollingApiItemTypeSelect[] = [];
	private _pageSize: number = 10;
	private _counter: number = 0;

	constructor(private source: string) {
		this._dummyItems = Array.from({length: 95}, (_, i) => ({
			item: `Option ${String(i).padStart(3, "0")}`,
			data: {
				displayname: `Option ${String(i).padStart(3, "0")}`,
				tooltip: `This is option ${i}`,
			},
		}));
		this._filteredDummyItems = this._dummyItems;
	}

	loading: boolean = false;

	error: Error | undefined;

	hasNextPage: boolean = true;

	loadMore() {
		if (this._counter < this._filteredDummyItems.length) {
			this.loading = true;
			const nextItems = this._filteredDummyItems.slice(
				this._counter,
				this._counter + this._pageSize,
			);
			this.items = this.items.concat(nextItems);
			this._counter += this._pageSize;
			this.hasNextPage = this._counter < this._filteredDummyItems.length;
			return new Promise<unknown>((resolve) => {
				setTimeout(() => {
					this.loading = false;
					resolve(undefined);
				}, 250);
			});
		}
		return Promise.resolve<unknown>(undefined);
	}

	setSearchTerms(terms: string[]) {
		this._filteredDummyItems =
			terms.length > 0
				? this._dummyItems.filter((it) =>
						it.item.toLowerCase().includes(terms[0].toLowerCase()),
					)
				: this._dummyItems;
		this._counter = 0;
		this.items = [];
		return Promise.resolve<unknown>(undefined);
	}

	setPageSize(size: number) {
		this._pageSize = size;
		return Promise.resolve<unknown>(undefined);
	}

	items: IScrollingApiItemTypeSelect[] = [];
}

export class ECommerceScrollingApiSelect
	implements IScrollingApi<IScrollingApiItemTypeSelect>
{
	constructor(private source: string) {}

	loading: boolean = false;

	error: Error | undefined;

	hasNextPage: boolean = true;

	async loadMore() {
		this.loading = true;
		const api = await ECommerceApiSingleton;
		const result =
			await api.scrollingApiLoadMore<IScrollingApiItemTypeSelect>({
				source: this.source,
			});
		this.hasNextPage = result.hasNextPage;
		this.items = result.items;
		this.loading = false;
	}

	async setSearchTerms(terms: string[]) {
		this.loading = true;
		const api = await ECommerceApiSingleton;
		const result =
			await api.scrollingApiSetParameters<IScrollingApiItemTypeSelect>({
				source: this.source,
				terms,
			});
		if (result.hasNextPage !== undefined)
			this.hasNextPage = result.hasNextPage;
		if (result.items !== undefined) this.items = result.items;
		this.loading = false;
	}

	async setPageSize(pageSize: number) {
		this.loading = true;
		const api = await ECommerceApiSingleton;
		const result =
			await api.scrollingApiSetParameters<IScrollingApiItemTypeSelect>({
				source: this.source,
				pageSize,
			});
		if (result.hasNextPage !== undefined)
			this.hasNextPage = result.hasNextPage;
		if (result.items !== undefined) this.items = result.items;
		this.loading = false;
	}

	items: IScrollingApiItemTypeSelect[] = [];
}

class _ScrollingApiFactory implements IScrollingApiFactory {
	getApiSelect(source: string): IScrollingApi<IScrollingApiItemTypeSelect> {
		// if window.parent === window return a dummy api for testing
		if (isRunningInPlatform() || window.parent === window) {
			return new DummyScrollingApiSelect(source);
		}
		return new ECommerceScrollingApiSelect(source);
	}
}

export const ScrollingApiFactory = new _ScrollingApiFactory();
