const { expect } = require("chai");
const EventManager = require("../lib/events");

beforeEach(async () => {
    EventManager.removeAllListeners();
});

describe("EventManager", () => {
    it("should not add a listener which is passed a non-function handler", async () => {
        expect(EventManager._events["test"]).to.not.exist;
        EventManager.addListener.bind("test", "not a function").should.throw(Error);
    });

    it("adds new event listeners", async () => {
        expect(EventManager._events["test"]).to.not.exist;
        EventManager.addListener("test", () => {
            return;
        });
        EventManager._events["test"].should.be.a("function");
    });

    it("removes individual listeners correctly", async () => {
        expect(EventManager._events["test"]).to.not.exist;
        EventManager.addListener("test", () => {
            return;
        });
        EventManager._events["test"].should.be.a("function");
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
        EventManager._events["test"].should.be.a("function");
        EventManager._events["test2"].should.be.a("function");
        EventManager.removeAllListeners();
        EventManager._events.should.be.an("object").that.is.empty;
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
        EventManager.fire({ type: "test" }, argData).should.eq(true);
        arg1Actual.should.eq("test arg1");
        arg2Actual.should.eq("test arg2");
    });

    it("does not fire unknown events", async () => {
        expect(EventManager._events["test"]).to.not.exist;
        const argData = {
            arg1: "test arg1",
            arg2: "test arg2",
        };
        EventManager.fire({ type: "test" }, argData).should.eq(false);
    });
});
