const utils = require('../lib/utils');
const should = require('chai').should();

describe('utils', _ => {
    describe('request()', _ => {
        it('POST should get an OK response', done => {
            const data = {
                name: 'foo',
                job: 'bar'
            }
            const headers = {
                'Content-type': 'application/json; charset=UTF-8'
            }
            utils.request('POST', 'https://reqres.in/api/users', headers, data).then(data => {
                data.name.should.eq('foo');
                done();
            });
        });

        it('GET should get an OK response', done => {
            utils.request('GET', 'https://reqres.in/api/users/2').then(res => {
                res.data.id.should.eq(2);
                done();
            });
        });

        it('DELETE should get OK response', done => {
            utils.request('DELETE', 'https://reqres.in/api/users/2').then(data => {
                console.log(data);
                data.should.be.a('string').that.is.empty;
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