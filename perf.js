import {LimitedBlockingQueue} from "./dist/index.js"

(async function() {
    bench("1000 push/pull on queue size 100", 3000, async () => {
        let q = new LimitedBlockingQueue(100);
        let pushPromises = new Array(1000);
        for(let i = 0; i < 1000; i++) {
            pushPromises.push(q.push(i))
        }
        for(let i = 0; i < 1000; i++) {
            await q.pull();
        }
    })
})()

async function bench(name, time, func, warmupTime = 1000) {
    console.log(name + ": warming up...");
    await benchImpl(func, warmupTime);
    console.log(name + ": running bench...");
    let result = await benchImpl(func, time);
    console.log(name + ": result: " + JSON.stringify(result));
    return result;
}

async function benchImpl(func, time) {
    let counter = 0;
    let benchStart = performance.now();
    let timeout = benchStart + time;
    let chunkSize = 1;
    while(true) {
        let start = performance.now();
        if (start > timeout) {
            break;
        }
        // console.log("Running chunk of size " + chunkSize)
        for(let i = 0; i < chunkSize; i++) {
            counter++;
            await func();
        }
        let duration = performance.now() - start;
        if (duration  < time / 16) {
            chunkSize *= 2;
        }
    }
    let benchEnd = performance.now();
    let benchDur = benchEnd - benchStart;
    let ratePerSec = 1000 * counter / benchDur;
    return {rate: ratePerSec, count: counter, time: benchDur};
}
