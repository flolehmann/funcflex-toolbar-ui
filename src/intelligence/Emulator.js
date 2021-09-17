import {nanoid} from "nanoid";

export class Emulator {

    taskList = {};
    running = false;

    constructor() {
    }

    addTask(task) {
        this.taskList[nanoid()] = task;
    }

    removeTask(id) {
        delete this.taskList[id];
    }

    async start() {
        console.log("EMULATOR", "start()");
        this.running = true;
        await new Promise(resolve => {
            const interval = setInterval(async () => {
                const taskList = this.getActiveTaskList();
                for (const [index, task] of taskList) {
                    switch (task.trigger) {
                        case TaskTrigger.INSTANT:
                            task.setRunning();
                            task.typing();
                            try {
                                const methodResult = await task.method();
                                console.log("METHOD CALL DEM", methodResult);
                                task.setDone();
                            } catch(err) {
                                console.log("NOPE", err);
                                task.setFailed();
                            }
                            break;
                        case TaskTrigger.TIME:
                            task.setRunning();
                            await this.delay(5000, task.typing);
                            try {
                                const methodResult = await this.delay(10000, task.method);
                                task.setDone();
                            } catch(err) {
                                task.setFailed();
                            }
                            break;
                        case TaskTrigger.USER_ACTIVITY:
                            break;
                    }

                }
                ;
                if (!this.running) {
                    console.log("EMULATOR", "STOPPING");
                    clearInterval(interval);
                }
            }, 2000);
            resolve("EMULATOR RESOLVED");
        });

    }

    stop() {
        this.running = false;
    }

    getActiveTaskList() {
        return Object.entries(this.taskList).filter(([id, task]) => {
            return task.state === TaskState.ADDED;
        });
    }

    delay(ms, callback) {
        return new Promise(resolve => {
            setTimeout(() => { resolve(callback()) }, ms);
        });
    }

}

export const TaskState = Object.freeze({
    "ADDED": "ADDED",
    "RUNNING": "RUNNING",
    "FAILED": "FAILED",
    "DONE": "DONE"
});

export const TaskTrigger = Object.freeze({
    "TIME": "TIME",
    "INSTANT": "INSTANT",
    "USER_ACTIVITY": "USER_ACTIVITY"
});

export class Task {

    state = TaskState.ADDED;
    marker;
    intent;
    trigger = TaskTrigger.INSTANT;
    typing; // callback
    method; // callback

    constructor(trigger = TaskTrigger.INSTANT, marker, intent, typing, method) {
        this.trigger = trigger;
        this.marker = marker;
        this.intent = intent;
        this.typing = typing
        this.method = method;
    }

    isTrigger(trigger) {
        return this.trigger === trigger;
    }

    setAdded() {
        this.state = TaskState.ADDED;
    }

    setRunning() {
        this.state = TaskState.RUNNING;
    }

    setFailed() {
        this.state = TaskState.FAILED;
    }

    setDone() {
        this.state = TaskState.DONE;
    }

}