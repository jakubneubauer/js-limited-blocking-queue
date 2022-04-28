# limited-blocking-queue

Javascript implementation of queue with asynchronous push/pull and with limit
of stored items. Operation `pull` returns a promise fulfilled whenever
the item will be available (possibly immediately). The `push` operation
returns a promise fulfilled when the push is possible to perform. If the queue
is not full, it will be immediately (with `Promise.resolve()`), if the queue
is full, it will be when enough items will be pulled.

```
npm install --save @jakubneubauer/limited-blocking-queue
```

## Example of Usage

### Demonstration of async pull
```javascript
import {LimitedBlockingQueue} from '@jakubneubauer/limited-blocking-queue';

var queue = new LimitedBlockingQueue();

// waits for next push()
queue.pull().then((result) => console.debug(result));

setTimeout(() => {
  queue.push('hello world')
}, 1000);
```

### Demonstration of async push
```javascript
import {LimitedBlockingQueue} from '@jakubneubauer/limited-blocking-queue';

var queue = new LimitedBlockingQueue(); // default size is 1

(async function() {
    // first push is done immediately
    queue.push(1).then(() => console.debug("first push done"));
    // second push is postponed because the queue is full
    queue.push(2).then(() => console.debug("second push done"));
    // Pull will make room in the queue, after that the second push will be done
    await queue.pull().then((item) => console.debug("Pulled item " + item));
    // This pulled item will be logged after the second push
    await queue.pull().then((item) => console.debug("Pulled item " + item));
})();
```
output:
```text
first push done
Pulled item 1
second push done
Pulled item 2
```