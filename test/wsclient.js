const { spawn } = require("child_process");
const sinon = require("sinon");
const { expect } = require("chai");
const WebSocketClient = require("../lib/wsclient");
const EventManager = require("../lib/events");

describe("wsclient", () => {
    let server;
    before((done) => {
        server = spawn("twitch", ["event", "start-websocket-server", "--reconnect", "11"]);
        setTimeout(done, 100);
    });

    after(() => {
        server.kill("SIGINT");
    });

    it("correctly handles session lifecycle", (done) => {
        const client = new WebSocketClient();
        let firstSessionID;
        const connection = client._addConnection((id) => (firstSessionID = id), "ws://localhost:8080/eventsub");
        const messageSpy = sinon.spy(connection._events, "message");
        const closeSpy = sinon.spy(connection._events, "close");
        const addConnectionSpy = sinon.spy(client, "_addConnection");
        const connectionLostSpy = sinon.spy(() => {});
        EventManager.addListener("connection_lost", connectionLostSpy);
        setTimeout(() => {
            const messageTypes = ["session_welcome", "session_keepalive", "session_reconnect"];
            // `onmessage` should be called three times
            expect(messageSpy.getCalls()).to.have.length(3);
            // the `message_type` for each should come in the order of the array above
            messageSpy.getCalls().forEach((call, index) => {
                const messageType = JSON.parse(call.args[0].toString()).metadata.message_type;
                expect(messageType).to.eq(messageTypes[index]);
            });
            // `onclose` should be called on the original connection
            sinon.assert.calledOnce(closeSpy);
            // a new connection should be added on reconnect
            sinon.assert.calledOnce(addConnectionSpy);
            const sessionIDs = Object.keys(client._connections);
            // when the new session is added and confirmed, the old one should be removed
            expect(sessionIDs).to.have.length(1);
            expect(firstSessionID).not.to.eq(sessionIDs[0]);
            // the `connection_lost` event should not have fired
            sinon.assert.notCalled(connectionLostSpy);
            done();
        }, 11500);
    }).timeout(12000);
});
