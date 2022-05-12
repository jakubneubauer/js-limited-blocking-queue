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
    q.close(null, true);
    expect(await q.pull()).toBe(1);
    await expect(q.pull()).rejects.toThrow('Queue is closed');
});

test('close clears pending items, pull will fail', async () => {
    let q = new LimitedBlockingQueue(1);
    await q.push(1);
    q.close();
    await expect(q.pull()).rejects.toThrow('Queue is closed');
});

//test('Race condition - waiting push can be overtaken by another push, then queue size is exceeded', async () => {
test('race', async () => {
    let p3 : Promise<any>|undefined = undefined
    let p4 : Promise<any>|undefined = undefined
    let q = new LimitedBlockingQueue(1);

    console.log("nextTick with log A")
    process.nextTick(() => {
        console.log("A")
    });
    console.log("push and await 1")
    await q.push(1).then(() => {console.log("then -> push 1")});
    console.log("push 2")
    let p2 = q.push(2).then(() => {console.log("then -> push 2")});
    console.log("after push 2")
    console.log("nextTick with push 3")
    process.nextTick(() => {
        console.log("push 3")
        p3 = q.push(3).then(() => {console.log("then -> push 2")});
        console.log("after push 3")
    });
    console.log("nextTick with push 4")
    process.nextTick(() => {
        console.log("push 4")
        p4 = q.push(4).then(() => {console.log("then -> push 2")});
        console.log("after push 4")
    });
    console.log("pull 1")
    let pullP1 = await q.pull();
    console.log("await pull promise 1")
    await pullP1;
    console.log("pull and await 2")
    console.log("pulled " + await q.pull());
    console.log("pull and await 3")
    console.log("pulled " + await q.pull());
    console.log("pull and await 4")
    console.log("pulled " + await q.pull());
    console.log("await p2")
    await p2
    console.log("await p3")
    await p3
    console.log("await p4")
    await p4
})