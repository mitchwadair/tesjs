const { expect } = require("chai");
const EventManager = require("../lib/events");

beforeEach(async () => {
    EventManager.removeAllListeners();
});

describe("EventManager", () => {
    it("should not add a listener which is passed a non-function handler", async () => {
        expect(EventManager._events["test"]).to.not.exist;
        try {
            EventManager.addListener("test", "not a function");
        } catch (error) {
            expect(error.message).to.eq("Event handler must be a function");
        }
    });

    it("adds new event listeners", async () => {
        expect(EventManager._events["test"]).to.not.exist;
        EventManager.addListener("test", () => {
            return;
        });
        expect(EventManager._events["test"]).to.exist;
        expect(typeof EventManager._events["test"]).to.eq("function");
    });

    it("removes individual listeners correctly", async () => {
        expect(EventManager._events["test"]).to.not.exist;
        EventManager.addListener("test", () => {
            return;
        });
        expect(EventManager._events["test"]).to.exist;
        expect(typeof EventManager._events["test"]).to.eq("function");
        EventManager.removeListener("test");
        expect(EventManager._events["test"]).to.not.exist;
    });

    it("does nothing when removing invalid listener", async () => {
        expect(EventManager._events["test"]).to.not.exist;
        EventManager.removeListener("test");
        expect(EventManager._events["test"]).to.not.exist;
    });

    it("removes all listeners correctly", async () => {
        expect(EventManager._events["test"]).to.not.exist;
        EventManager.addListener("test", () => {
            return;
        });
        EventManager.addListener("test2", () => {
            return;
        });
        expect(EventManager._events["test"]).to.exist;
        expect(typeof EventManager._events["test"]).to.eq("function");
        expect(EventManager._events["test2"]).to.exist;
        expect(typeof EventManager._events["test2"]).to.eq("function");
        EventManager.removeAllListeners();
        expect(EventManager._events).to.be.empty;
    });

    it("fires existing events correctly with correct arguments", async () => {
        expect(EventManager._events["test"]).to.not.exist;
        const argData = {
            arg1: "test arg1",
            arg2: "test arg2",
        };
        let arg1Actual, arg2Actual;
        EventManager.addListener("test", ({ arg1, arg2 }) => {
            arg1Actual = arg1;
            arg2Actual = arg2;
        });
        expect(EventManager.fire({ type: "test" }, argData)).to.eq(true);
        expect(arg1Actual).to.eq("test arg1");
        expect(arg2Actual).to.eq("test arg2");
    });

    it("does not fire unknown events", async () => {
        expect(EventManager._events["test"]).to.not.exist;
        const argData = {
            arg1: "test arg1",
            arg2: "test arg2",
        };
        expect(EventManager.fire({ type: "test" }, argData)).to.eq(false);
    });
});
