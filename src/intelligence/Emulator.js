import {nanoid} from "nanoid";

export class Emulator {

    taskList = {};
    running = false;

    constructor() {
    }

    addTask(task) {
        console.log("ADD TASK TO EMU", task);
        this.taskList[nanoid()] = task;
    }

    removeTask(id) {
        delete this.taskList[id];
    }

    // Emulator iteratively executes tasks with an interval of 2000 milliseconds
    async start() {
        this.running = true;
        await new Promise(resolve => {
            const interval = setInterval( async () => {
                const taskList = this.getActiveTaskList();
                this.setTasksRunning(taskList);
                for (const [index, task] of taskList) {
                    switch (task.trigger) {
                        case TaskTrigger.INSTANT:
                            task.typing();
                            try {
                                task.method();
                                task.setDone();
                            } catch (err) {
                                task.setFailed();
                            }
                            break;
                        case TaskTrigger.TIME:
                            const typingDelayMin = task.timeConfig.typingDelayMin;
                            const typingDelayMax = task.timeConfig.typingDelayMax;
                            this.delay(this.timeFromRandomInterval(typingDelayMin, typingDelayMax), task.typing).then(result => {
                                try {
                                    const executionDelayMin = task.timeConfig.executionDelayMin;
                                    const executionDelayMax = task.timeConfig.executionDelayMax;
                                    this.delay(this.timeFromRandomInterval(executionDelayMin, executionDelayMax), task.method);
                                    task.setDone();
                                } catch (err) {
                                    task.setFailed();
                                }
                            });
                            break;
                        case TaskTrigger.USER_ACTIVITY:
                            break;
                    }
                }

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

    setTasksRunning(taskList) {
        for (const [index, task] of taskList) {
            task.setRunning();
        }
    }

    delay(ms, callback) {
        return new Promise(resolve => {
            setTimeout(() => { resolve(callback()) }, ms);
        });
    }

    timeFromRandomInterval(min = 100, max = 5000) {
        const limit = min + max;
        const rand = Math.floor(Math.random() * limit);
        if (rand <= min) {
            return min;
        } else if (rand >= max) {
            return max;
        } else {
            return rand;
        }
    }

    getRandomInt(max) {
        return Math.floor(Math.random() * max);
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

export class TimeConfig {
    typingDelayMin;
    typingDelayMax;
    executionDelayMin;
    executionDelayMax;

    constructor(typingDelayMin = 1500, typingDelayMax = 3500, executionDelayMin = 10500, executionDelayMax= 15500) {
        this.typingDelayMin = typingDelayMin;
        this.typingDelayMax = typingDelayMax;
        this.executionDelayMin = executionDelayMin;
        this.executionDelayMax = executionDelayMax;
    }
}

export class Task {

    state = TaskState.ADDED;
    marker;
    intent;
    trigger = TaskTrigger.INSTANT;
    typing; // callback
    method; // callback

    constructor(trigger = TaskTrigger.INSTANT, marker, intent, typing, method, timeConfig = new TimeConfig()) {
        this.trigger = trigger;
        this.marker = marker;
        this.intent = intent;
        this.typing = typing
        this.method = method;
        this.timeConfig = timeConfig;
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

    isRunning() {
        if (this.state === TaskState.RUNNING) {
            return true;
        }
        return false;
    }

}