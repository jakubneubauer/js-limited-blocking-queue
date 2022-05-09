export class LimitedBlockingQueue {

    private readonly limit: number;
    private readonly queue: any[];
    private readonly notEmptyResolves: ((_:any)=>any)[];
    private readonly notFullResolves: ((_:any)=>any)[];

    constructor(size = 1) {
        this.queue = [];
        this.limit = size;
        this.notEmptyResolves = [];
        this.notFullResolves = [];
    }

    // Asynchronous. Returns promise that will be satisfied when the item is really pushed.
    // It could be not immediate, when the buffer is full.
    push(item: any): Promise<any> {
        if (this.notEmptyResolves.length) {
            // assert(this.queue.length === 0)
            // Don't put the item to queue - give it directly to the waiting
            // consumer through the resolve of promise he obtained.
            this.notEmptyResolves.shift()!(item);
            return Promise.resolve();
        } else {
            if (this.queue.length === this.limit) {
                return new Promise((resolve) => {
                    this.notFullResolves.push(resolve);
                }).then(() => {
                    this.queue.push(item);
                });
            } else {
                this.queue.push(item);
                return Promise.resolve();
            }
        }
    }

    // Asynchronous. Returns promise that will be resolved with the object pulled from the queue.
    pull() {
        if (this.queue.length === 0) {
            return new Promise((resolve) => {
                this.notEmptyResolves.push(resolve);
            });
        } else {
            let item = this.queue.shift();
            if (this.notFullResolves.length) {
                this.notFullResolves.shift()!(undefined);
            }
            return Promise.resolve(item);
        }
    }

    get length() {
        return this.queue.length;
    }
}
