import {LimitedBlockingQueue} from "../src/limited-blocking-queue";

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

test('close will reject all waiting pull operations', async () => {
    let q = new LimitedBlockingQueue(2);

    // test pull before close will be rejected after close
    let pullPromise1 = q.pull();
    let pullPromise2 = q.pull();
    q.close();
    await expect(pullPromise1).rejects.toThrow('Queue is closed');
    await expect(pullPromise2).rejects.toThrow('Queue is closed');
    
    // test pull after close
    await expect(q.pull()).rejects.toThrow('Queue is closed');
});

test('close will reject all waiting push operations', async () => {
    let q = new LimitedBlockingQueue(1);
    await q.push(1);
    
    // test push before close will be rejected after close
    let pushPromise1 = q.push(2);
    let pushPromise2 = q.push(3);
    q.close();
    await expect(pushPromise1).rejects.toThrow('Queue is closed');
    await expect(pushPromise2).rejects.toThrow('Queue is closed');
    
    // test push after close
    await expect(q.push(4)).rejects.toThrow('Queue is closed');
});

test('close with allowing pull remaining items', async () => {
    let q = new LimitedBlockingQueue(1);
    await q.push(1);
    q.close(true);
    expect(await q.pull()).toBe(1);
    await expect(q.pull()).rejects.toThrow('Queue is closed');
});

test('close clears pending items, pull will fail', async () => {
    let q = new LimitedBlockingQueue(1);
    await q.push(1);
    q.close();
    await expect(q.pull()).rejects.toThrow('Queue is closed');
});
