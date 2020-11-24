const utils = require('../lib/utils');
const should = require('chai').should();

describe('utils', _ => {
    describe('request()', _ => {
        it('POST should get an OK response', done => {
            const data = {
                title: 'foo',
                text: 'bar'
            }
            const headers = {
                'Content-type': 'application/json; charset=UTF-8'
            }
            utils.request('POST', 'https://jsonplaceholder.typicode.com/posts', headers, data).then(data => {
                data.title.should.eq('foo');
                done();
            });
        });

        it('GET should get an OK response', done => {
            utils.request('GET', 'https://jsonplaceholder.typicode.com/posts/1').then(data => {
                data.id.should.eq(1);
                done();
            });
        });

        it('DELETE should get OK response', done => {
            utils.request('DELETE', 'https://jsonplaceholder.typicode.com/posts/1').then(data => {
                data.should.be.an('object').that.is.empty;
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
            utils.objectShallowEquals(obj1, obj2).should.eq(true);
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
            utils.objectShallowEquals(obj1, obj2).should.eq(false);
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
            utils.objectShallowEquals(obj1, obj2).should.eq(false);
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
            utils.objectShallowEquals(obj1, obj2).should.eq(false);
            done();
        });
    });
});