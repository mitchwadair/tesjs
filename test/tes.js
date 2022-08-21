const { expect } = require("chai");
const TES = require("../main");
const { buildObjectWithoutKey } = require("./testUtil");

describe("TES", () => {
    const validIdentity = {
        id: "test",
        secret: "t35t",
    };
    const validListener = {
        baseURL: "https://test.com",
        secret: "wh5ecr3t",
    };
    const configValid = {
        identity: validIdentity,
        listener: validListener,
    };

    const configMissingIdentity = buildObjectWithoutKey(configValid, "identity");
    const configMissingListener = buildObjectWithoutKey(configValid, "listener");
    const configMissingId = {
        identity: buildObjectWithoutKey(validIdentity, "id"),
        listener: validListener,
    };
    const configMissingIdentitySecret = {
        identity: buildObjectWithoutKey(validIdentity, "secret"),
        listener: validListener,
    };
    const configMissingBaseURL = {
        identity: validIdentity,
        listener: buildObjectWithoutKey(validListener, "baseURL"),
    };
    const configMissingListenerSecret = {
        identity: validIdentity,
        listener: buildObjectWithoutKey(validListener, "secret"),
    };

    const tryInitTES = (config) => {
        const tes = new TES(config);
        return tes;
    };

    beforeEach(() => {
        TES._instance = null;
    });

    it("errors when 'identity' is missing in config", () => {
        expect(() => tryInitTES(configMissingIdentity)).to.throw(Error);
    });

    it("errors when 'listener' is missing from config", () => {
        expect(() => tryInitTES(configMissingListener)).to.throw(Error);
    });

    it("errors when 'id' is missing from identity", () => {
        expect(() => tryInitTES(configMissingId)).to.throw(Error);
    });

    it("errors when 'secret' is missing from identity", () => {
        expect(() => tryInitTES(configMissingIdentitySecret)).to.throw(Error);
    });

    it("errors when 'baseURL' is missing from listener", () => {
        expect(() => tryInitTES(configMissingBaseURL)).to.throw(Error);
    });

    it("errors when 'secret' is missing from listener", () => {
        expect(() => tryInitTES(configMissingListenerSecret)).to.throw(Error);
    });

    it("returns an instance of itself", (done) => {
        const tes = tryInitTES(configValid);
        setTimeout(() => {
            tes._whserverlistener.close();
            expect(tes).to.be.an.instanceOf(TES);
            done();
        }, 100);
    });
});
