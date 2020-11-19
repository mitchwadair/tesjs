const utils = require('../src/utils');
const assert = require('assert');

describe('request()', _ => {
    it('should get an OK response', done => {
        utils.request('GET', 'https://yesno.wtf/api').then(data => {
            assert.notStrictEqual(data, null);
            done();
        });
    });
});

describe('objectShallowEquals', _ => {
    it('should return true when two objects match', done => {
        const obj1 = {
            k1: 'key1',
            k2: 'key2'
        }
        const obj2 = {
            k1: 'key1',
            k2: 'key2'
        }
        assert.strictEqual(utils.objectShallowEquals(obj1, obj2), true);
        done();
    });

    it('should return false when two objects do not match', done => {
        const obj1 = {
            k1: 'key1',
            k2: 'key2'
        }
        const obj2 = {
            wrong: 'different'
        }
        assert.strictEqual(utils.objectShallowEquals(obj1, obj2), false);
        done();
    });
});