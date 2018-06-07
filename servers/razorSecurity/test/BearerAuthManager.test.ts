import * as chai  from "chai";
import {BearerAuthManager} from "../lib/bearerAuthManager";
import {IAauthenticationResult} from "../lib/dataModels/IAauthenticationResult";
let expect = chai.expect;
let should = chai.should();



describe("Testing BearerAuthManager class authentication methods", () => {

    let generatedToken = null;
    let _bearerAuthManager = new BearerAuthManager();
    process.env.jwt_token_secret = "abc";

    it("createToken method should return token and the token must be valid", () => {
        generatedToken = _bearerAuthManager.createToken("testingToken","100d");
        should.exist(generatedToken);

    })

    it("authenticateCall should return that token is authorized and valid", done => {
        (async () => {
            let validTokenDc:[any] = [{}];
            validTokenDc["authorization"] = "bearer " + generatedToken;
            const _promise = _bearerAuthManager.authenticateCall(validTokenDc);
            try {
                let results: IAauthenticationResult = await _promise;
                expect(results.isAuthorized).to.be.true;
                done();
            }
            catch (err){
                done(err);
            }
        })();
    });

    it.skip("authenticateCall should return that  token is not valid", done => {
        (async () => {
            const _promise = _bearerAuthManager.authenticateCall(["abcdefg"]);
            try {
                let results: IAauthenticationResult = await _promise;
                expect(results.isAuthorized).to.be.false;
                done();
            }
            catch (err) {
                done(err);
            }
        })();
    });


    it.skip("authenticateCall should throw exception when no header pass",done => {
        (async () => {
            const _promise = _bearerAuthManager.authenticateCall(null);
            try {
                let results: IAauthenticationResult = await _promise;
                done('failed');
            }
            catch (err) {
                done();
            }
            ;
        })();
    });

});

