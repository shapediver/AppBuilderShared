import {
	IScrollingApi,
	IScrollingApiFactory,
	IScrollingApiItemTypeSelect,
} from "./types/scrollingapi";

export class DummyScrollingApiSelect
	implements IScrollingApi<IScrollingApiItemTypeSelect>
{
	private source: string;
	private _dummyItems: IScrollingApiItemTypeSelect[] = [];
	private _filteredDummyItems: IScrollingApiItemTypeSelect[] = [];
	private _pageSize: number = 10;
	private _counter: number = 0;

	constructor(source: string) {
		this.source = source;
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

	setSearchTerm(term: string) {
		this._filteredDummyItems = term
			? this._dummyItems.filter((it) =>
					it.item.toLowerCase().includes(term.toLowerCase()),
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

class _ScrollingApiFactory implements IScrollingApiFactory {
	getApiSelect(source: string): IScrollingApi<IScrollingApiItemTypeSelect> {
		return new DummyScrollingApiSelect(source);
	}
}

export const ScrollingApiFactory = new _ScrollingApiFactory();
