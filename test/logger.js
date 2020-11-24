const logger = require('../lib/logger');
const sinon = require('sinon');

describe('logger', _ => {
    let spy;

    beforeEach(done => {
        spy = sinon.spy(console, 'log');
        done();
    });
    afterEach(done => {
        console.log.restore();
        logger.setLevel('none');
        done();
    });

    it('should not log anything at none level', done => {
        logger.setLevel('none');
        logger.log('this is an info log');
        logger.warn('this is a warn log');
        logger.error('this is an error log');
        logger.debug('this is a debug log');
        sinon.assert.notCalled(spy);
        done();
    });

    it('should only log info at info level', done => {
        logger.setLevel('info');
        logger.log('this is an info log');
        logger.warn('this is a warn log');
        logger.error('this is an error log');
        logger.debug('this is a debug log');
        sinon.assert.calledOnce(spy);
        done();
    });

    it('should only log info and warn at warn level', done => {
        logger.setLevel('warn');
        logger.log('this is an info log');
        logger.warn('this is a warn log');
        logger.error('this is an error log');
        logger.debug('this is a debug log');
        sinon.assert.calledTwice(spy);
        done();
    });

    it('should only log info, warn and error at error level', done => {
        logger.setLevel('error');
        logger.log('this is an info log');
        logger.warn('this is a warn log');
        logger.error('this is an error log');
        logger.debug('this is a debug log');
        sinon.assert.calledThrice(spy);
        done();
    });

    it('should log all levels at debug level', done => {
        logger.setLevel('debug');
        logger.log('this is an info log');
        logger.warn('this is a warn log');
        logger.error('this is an error log');
        logger.debug('this is a debug log');
        sinon.assert.callCount(spy, 4);
        done();
    });
})