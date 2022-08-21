const logger = require("../lib/logger");
const sinon = require("sinon");

describe("logger", () => {
    let stub;

    beforeEach(async () => {
        stub = sinon.stub(console, "log");
    });
    afterEach(async () => {
        stub.restore();
        logger.setLevel("none");
    });

    it("should not log anything at none level", async () => {
        logger.setLevel("none");
        logger.log("this is an info log");
        logger.warn("this is a warn log");
        logger.error("this is an error log");
        logger.debug("this is a debug log");
        sinon.assert.notCalled(stub);
    });

    it("should only log info at info level", async () => {
        logger.setLevel("info");
        logger.log("this is an info log");
        logger.warn("this is a warn log");
        logger.error("this is an error log");
        logger.debug("this is a debug log");
        sinon.assert.calledOnce(stub);
    });

    it("should only log info and warn at warn level", async () => {
        logger.setLevel("warn");
        logger.log("this is an info log");
        logger.warn("this is a warn log");
        logger.error("this is an error log");
        logger.debug("this is a debug log");
        sinon.assert.calledTwice(stub);
    });

    it("should only log info, warn and error at error level", async () => {
        logger.setLevel("error");
        logger.log("this is an info log");
        logger.warn("this is a warn log");
        logger.error("this is an error log");
        logger.debug("this is a debug log");
        sinon.assert.calledThrice(stub);
    });

    it("should log all levels at debug level", async () => {
        logger.setLevel("debug");
        logger.log("this is an info log");
        logger.warn("this is a warn log");
        logger.error("this is an error log");
        logger.debug("this is a debug log");
        sinon.assert.callCount(stub, 4);
    });
});
