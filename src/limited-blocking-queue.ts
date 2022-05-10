export class LimitedBlockingQueue {

    private closed: boolean;
    private readonly limit: number;
    private queue: any[];
    // list of resolve,reject tuples.
    private notEmptyResolves: ([(_:any)=>any, (_:any)=>any])[];
    // list of resolve,reject tuples.
    private notFullResolves: ([(_:any)=>any, (_:any)=>any])[];

    constructor(size = 1) {
        this.closed = false;
        this.queue = [];
        this.limit = size;
        this.notEmptyResolves = [];
        this.notFullResolves = [];
    }

    // Asynchronous. Returns promise that will be satisfied when the item is really pushed.
    // It could be not immediate, when the buffer is full.
    push(item: any): Promise<any> {
        if(this.closed) {
            return Promise.reject(new Error("Queue is closed"));
        }
        if (this.notEmptyResolves.length) {
            // assert(this.queue.length === 0)
            // Don't put the item to queue - give it directly to the waiting
            // consumer through the resolve of promise he obtained.
            this.notEmptyResolves.shift()![0](item);
            return Promise.resolve();
        } else {
            if (this.queue.length === this.limit) {
                return new Promise((resolve, reject) => {
                    this.notFullResolves.push([resolve, reject]);
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
            if(this.closed) {
                return Promise.reject(new Error("Queue is closed"));
            }
            return new Promise((resolve, reject) => {
                this.notEmptyResolves.push([resolve, reject]);
            });
        } else {
            let item = this.queue.shift();
            if (this.notFullResolves.length) {
                this.notFullResolves.shift()![0](undefined);
            }
            return Promise.resolve(item);
        }
    }

    /**
     * Closes the queue. Rejects all waiting operations.
     * If queue is not empty and allowToPullPendingItems is true, subsequent pulls will get the remaining items.
     * If allowToPullPendingItems is false (default), the queue is cleared.
     * However, subsequent calls will fail.
     * 
     * @param allowToPullPendingItems If false, the queue is emptied.
     */
    close(allowToPullPendingItems = false) {
        this.closed = true;
        // reject waiting promises - both the waiting pull and push operations
        this.notFullResolves.forEach(([_,reject]) => {reject(new Error("Queue is closed"))});
        this.notFullResolves = [];
        this.notEmptyResolves.forEach(([_,reject]) => {reject(new Error("Queue is closed"))});
        this.notEmptyResolves = [];
        if (!allowToPullPendingItems) {
            this.queue = [];
        }
    }

    get length() {
        return this.queue.length;
    }
}
