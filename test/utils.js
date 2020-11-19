const utils = require('../src/utils');
const assert = require('assert');

describe('utils', _ => {
    describe('request()', _ => {
        it('should get an OK response', done => {
            utils.request('GET', 'https://yesno.wtf/api').then(data => {
                assert.notStrictEqual(data, null);
                done();
            });
        });
    });

    describe('objectShallowEquals()', _ => {
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
    
        it('should return false when second object keys dont match first object keys', done => {
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
    
        it('should return false when second object values dont match first object values', done => {
            const obj1 = {
                k1: 'key1',
                k2: 'key2'
            }
            const obj2 = {
                k1: 'not key1',
                k2: 'not key2'
            }
            assert.strictEqual(utils.objectShallowEquals(obj1, obj2), false);
            done();
        });
    
        it('should return false when second object has extra keys', done => {
            const obj1 = {
                k1: 'key1',
                k2: 'key2'
            }
            const obj2 = {
                k1: 'key1',
                k2: 'key2',
                k3: 'new key'
            }
            assert.strictEqual(utils.objectShallowEquals(obj1, obj2), false);
            done();
        });
    });
});