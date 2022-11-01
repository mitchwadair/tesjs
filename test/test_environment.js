const { expect } = require("chai");
const { cmd } = require("./testUtil");

describe("Test Environment", () => {
    it("has required twitch CLI installed", async () => {
        try {
            const out = await cmd("twitch version");
            expect(out).to.contain("1.1.12");
        } catch (err) {
            throw new Error("Twitch CLI not installed");
        }
    });
});
