const EventManager = require('../src/events');
const should = require('chai').should();

beforeEach(done => {
    EventManager.removeAllListeners();
    done();
});

describe('EventManager', _ => {
    it('adds new event handlers', done => {
        should.not.exist(EventManager._events['test']);
        EventManager.addListener('test', _ => {return});
        EventManager._events['test'].should.be.a('function');
        done();
    });

    it('removes individual listeners correctly', done => {
        should.not.exist(EventManager._events['test']);
        EventManager.addListener('test', _ => {return});
        EventManager._events['test'].should.be.a('function');
        EventManager.removeListener('test');
        should.not.exist(EventManager._events['test']);
        done();
    });

    it('removes all listeners correctly', done => {
        should.not.exist(EventManager._events['test']);
        EventManager.addListener('test', _ => {return});
        EventManager.addListener('test2', _ => {return});
        EventManager._events['test'].should.be.a('function');
        EventManager._events['test2'].should.be.a('function');
        EventManager.removeAllListeners();
        EventManager._events.should.be.an('object').that.is.empty;
        done();
    });

    it('fires existing events correctly with correct arguments', done => {
        should.not.exist(EventManager._events['test']);
        const argData = {
            arg1: 'test arg1',
            arg2: 'test arg2'
        }
        let arg1Actual, arg2Actual;
        EventManager.addListener('test', (arg1, arg2) => {
            arg1Actual = arg1;
            arg2Actual = arg2;
        });
        EventManager.fire('test', argData).should.eq(true);
        arg1Actual.should.eq('test arg1');
        arg2Actual.should.eq('test arg2');
        done();
    });

    it('does not fire unknown events', done => {
        should.not.exist(EventManager._events['test']);
        const argData = {
            arg1: 'test arg1',
            arg2: 'test arg2'
        }
        EventManager.fire('test', argData).should.eq(false);
        done();
    });
})