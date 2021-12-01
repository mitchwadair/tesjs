const should = require('chai').should();
const TES = require('../main');

describe('TES', _ => {
    it('returns an instance of itself', done => {
        const tes = new TES({
            identity: {
                id: 'test',
                secret: 't35t'
            },
            listener: {
                baseURL: 'https://test.com',
            },
            path : "/TEST/eventsub"
        });
        setTimeout(_ => {
            tes._whserverlistener.close();
            tes.should.be.an.instanceof(TES);
            done();
        }, 100);
    });
});