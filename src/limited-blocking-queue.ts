/**
 * Queue with asynchronous pull/push operations. The queue size is limited to given number of items.
 */
export class LimitedBlockingQueue {

    // boolean indicating the queue was closed. If true, pull/push results will be rejected promise with 'closeReason'
    private closed: boolean;
    private closeReason: any;
    // Limit size of the queue
    private readonly limit: number;
    // The queue itself 
    private queue: any[];
    // List of resolve,reject tuples - promises of pull operations waiting to the queue to be not empty. 
    private notEmptyWaiters: ([(_:any)=>any, (_:any)=>any])[];
    // List of resolve,reject tuples - promises of push operations waiting to the queue to be not full.
    private notFullWaiters: ([(_:any)=>any, (_:any)=>any, any])[];

    /**
     * Creates new queue, limited to the given size. Default is 1.
     * 
     * @param size Maximum size of the queue, defaults to 1.
     */
    constructor(size = 1) {
        this.closed = false;
        this.queue = [];
        this.limit = size;
        this.notEmptyWaiters = [];
        this.notFullWaiters = [];
    }

    /**
     * Returns promise that will be resolved when the item is really pushed.
     * It will be immediately resolved,if the buffer is not full. Otherwise
     * the Promise will be resolved after some item will be pulled out of the queue.
     */
    push(item: any): Promise<any> {
        if(this.closed) {
            return Promise.reject(this.closeReason);
        }
        if (this.notEmptyWaiters.length) {
            // assert(this.queue.length === 0)
            // Don't put the item to queue - give it directly to the waiting
            // consumer with the resolver of his promise.
            this.notEmptyWaiters.shift()![0](item);
            return Promise.resolve();
        } else {
            if (this.queue.length === this.limit) {
                return new Promise((resolve, reject) => {
                    this.notFullWaiters.push([resolve, reject, item]);
                });
            } else {
                this.queue.push(item);
                return Promise.resolve();
            }
        }
    }

    /**
     * Returns promise resolved with an object pulled from the queue. If the queue is not empty,
     * the returned promise is immediately resolved.
     */
    pull(): Promise<any> {
        if (this.queue.length === 0) {
            if(this.closed) {
                return Promise.reject(new Error("Queue is closed"));
            }
            return new Promise((resolve, reject) => {
                this.notEmptyWaiters.push([resolve, reject]);
            });
        } else {
            let item = this.queue.shift();
            if (this.notFullWaiters.length) {
                let waitingPushInfo = this.notFullWaiters.shift()!
                this.queue.push(waitingPushInfo[2]);
                waitingPushInfo[0](undefined);
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
     * @param reason If set, this will be used to reject pending operations promises.
     * @param allowToPullPendingItems If false, the queue is emptied.
     */
    close(reason: any = undefined, allowToPullPendingItems = false) {
        this.closed = true;
        this.closeReason = reason ?? new Error("Queue is closed");
        // reject waiting promises - both the waiting pull and push operations
        this.notFullWaiters.forEach(([_,reject]) => {reject(this.closeReason)});
        this.notFullWaiters = [];
        this.notEmptyWaiters.forEach(([_,reject]) => {reject(this.closeReason)});
        this.notEmptyWaiters = [];
        if (!allowToPullPendingItems) {
            this.queue = [];
        }
    }

    /**
     * Current size of the queue - number of items available to pull.
     */
    get length() {
        return this.queue.length;
    }
}
