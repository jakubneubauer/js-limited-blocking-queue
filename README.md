# limited-blocking-queue

# async-blocking-queue

Javascript implementation of queue with asynchronous push/pull and with limit
of stored items. Operation `pull` returns a promise fulfilled whenever
the item will be available (possibly immediately). The `push` operation
returns a promise fulfilled when the push is possible to perform. If the queue
is not full, it will be immediately (with `Promise.resolve()`), if the queue
is full, it will be when enough items will be pulled.

```
npm install --save limited-blocking-queue
```

Example of Usage
------------------

```javascript
import {LimitedBlockingQueue} from 'limited-blocking-queue';

var queue = new LimitedBlockingQueue();

// wait for next enqueue() result
queue.pull().then((result) => console.info(result));

setTimeout(() => {
  queue.push('hello world')
}, 1000);

```
