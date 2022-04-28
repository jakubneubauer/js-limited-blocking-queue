import {LimitedBlockingQueue} from "./limited-blocking-queue.js";

test('push before pull', async () => {
    let q = new LimitedBlockingQueue(2);
    await q.push(1);
    await q.push(2);
    await q.pull().then((item) => expect(item).toBe(1));
    await q.pull().then((item) => expect(item).toBe(2));
});

test('pull before push', async () => {
    let q = new LimitedBlockingQueue(1);
    let promise1 = q.pull().then((item) => expect(item).toBe(1));
    let promise2 = q.pull().then((item) => expect(item).toBe(2));
    await q.push(1);
    await q.push(2);
    await promise1;
    await promise2;
});
