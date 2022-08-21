const { expect } = require("chai");
const { objectShallowEquals } = require("../lib/utils");

describe("utils", () => {
    describe("objectShallowEquals()", () => {
        it("should return true when two objects match", async () => {
            const obj1 = {
                k1: "key1",
                k2: "key2",
            };
            const obj2 = {
                k1: "key1",
                k2: "key2",
            };
            expect(objectShallowEquals(obj1, obj2)).to.eq(true);
        });

        it("should return false when second object keys dont match first object keys", async () => {
            const obj1 = {
                k1: "key1",
                k2: "key2",
            };
            const obj2 = {
                wrong: "different",
            };
            expect(objectShallowEquals(obj1, obj2)).to.eq(false);
        });

        it("should return false when second object values dont match first object values", async () => {
            const obj1 = {
                k1: "key1",
                k2: "key2",
            };
            const obj2 = {
                k1: "not key1",
                k2: "not key2",
            };
            expect(objectShallowEquals(obj1, obj2)).to.eq(false);
        });

        it("should return false when second object has extra keys", async () => {
            const obj1 = {
                k1: "key1",
                k2: "key2",
            };
            const obj2 = {
                k1: "key1",
                k2: "key2",
                k3: "new key",
            };
            expect(objectShallowEquals(obj1, obj2)).to.eq(false);
        });
    });
});
