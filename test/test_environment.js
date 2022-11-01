const { expect } = require("chai");
const { cmd } = require("./testUtil");

describe("Test Environment", () => {
    it("has the twitch CLI installed", async () => {
        try {
            const out = await cmd("twitch version");
            expect(out).to.not.be.undefined;
        } catch (err) {
            throw new Error("Twitch CLI not installed");
        }
    });
});
