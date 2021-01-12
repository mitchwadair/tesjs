const EventManager = require('../lib/events');
const should = require('chai').should();

beforeEach(done => {
    EventManager.removeAllListeners();
    done();
});

describe('EventManager', _ => {
    it('should not add a listener which is passed a non-function handler', done => {
        should.not.exist(EventManager._events['test']);
        EventManager.addListener.bind('test', 'not a function').should.throw(Error);
        done();
    });

    it('adds new event listeners', done => {
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

    it('does nothing when removing invalid listener', done => {
        should.not.exist(EventManager._events['test']);
        EventManager.removeListener('test');
        should.not.exist(EventManager._events['test']);
        done();
    })

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
        EventManager.addListener('test', event => {
            arg1Actual = event.arg1;
            arg2Actual = event.arg2;
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