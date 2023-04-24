const { spawn } = require("child_process");
const sinon = require("sinon");
const { expect } = require("chai");
const { cmd } = require("./testUtil");
const WebSocketClient = require("../lib/wsclient");
const EventManager = require("../lib/events");

describe("wsclient", () => {
    let server;
    // Start a new WebSocket server for each test so we are 100% fresh each time
    beforeEach(function (done) {
        server = spawn("twitch", ["event", "websocket", "start-server"]);
        setTimeout(done, 100);
    });

    afterEach(() => {
        server.kill("SIGINT");
    });

    /**
     * When connecting to the server, we expect to get a welcome message
     * After 10 seconds, we expect a keepalive message
     */
    it("connects to a websocket server", (done) => {
        const client = new WebSocketClient();
        const connection = client._addConnection(() => {}, "ws://localhost:8080/ws");
        const messageSpy = sinon.spy(connection._events, "message");
        setTimeout(() => {
            const messageTypes = ["session_welcome", "session_keepalive"];
            // `onmessage` should be called two times
            expect(messageSpy.getCalls()).to.have.length(2);
            // the `message_type` for each should come in the order of the array above
            messageSpy.getCalls().forEach((call, index) => {
                const messageType = JSON.parse(call.args[0].toString()).metadata.message_type;
                expect(messageType).to.eq(messageTypes[index]);
            });
            done();
        }, 11500);
    }).timeout(12000);

    /**
     * We should expect that the `session_reconnect` message happens when we reconnect
     */
    it("reconnects properly", async () => {
        const client = new WebSocketClient();
        let firstSessionID;
        const connection = client._addConnection((id) => {
            firstSessionID = id;
        }, "ws://localhost:8080/ws");
        const messageSpy = sinon.spy(connection._events, "message");
        const closeSpy = sinon.spy(connection._events, "close");
        const addConnectionSpy = sinon.spy(client, "_addConnection");
        await cmd(`twitch event websocket reconnect`);
        await new Promise((resolve) => {
            setTimeout(() => {
                expect(messageSpy.getCalls().length).to.be.greaterThan(0);
                expect(
                    messageSpy
                        .getCalls()
                        .some(
                            (call) => JSON.parse(call.args[0].toString()).metadata.message_type === "session_reconnect"
                        )
                ).to.be.true;
                // `onclose` should be called on the original connection
                sinon.assert.calledOnce(closeSpy);
                // a new connection should be added on reconnect
                sinon.assert.calledOnce(addConnectionSpy);
                const sessionIDs = Object.keys(client._connections);
                // when the new session is added and confirmed, the old one should be removed
                expect(sessionIDs).to.have.length(1);
                expect(firstSessionID).not.to.eq(sessionIDs[0]);
                resolve();
            }, 500);
        });
    });

    it("fires events", async () => {
        const eventSpy = sinon.spy();
        EventManager.addListener("channel.ban", eventSpy);
        const client = new WebSocketClient();
        client._addConnection(() => {}, "ws://localhost:8080/ws");
        await cmd(`twitch event trigger channel.ban --transport=websocket`);
        await new Promise((resolve) => {
            setTimeout(() => {
                sinon.assert.calledOnce(eventSpy);
                resolve();
            }, 500);
        });
    });
});
