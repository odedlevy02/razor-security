/**
 * Created by ben.m on 29/12/16.
 */
import * as jwtToken from "jsonwebtoken";

import * as request from "superagent";
import {IAauthenticationResult} from "./dataModels/IAauthenticationResult";

export class BearerAuthManager {

    constructor(){

        if(!process.env.jwt_token_secret){
            throw new Error("Env key 'jwt_token_secret' is mandatory and has not been set. Validate to load env variables before importing BearerAuthManager")
        }
    }

    public createToken = (data: any, expires: string): string => {
        return this.createTokenWithExpire(data, expires);
    }

    public authenticateCall = (headers: [any]): Promise<IAauthenticationResult> => {
        return new Promise<IAauthenticationResult>((resolve, reject) => {
            var bearerToken;
            var bearerHeader = headers["authorization"];
            let result = new IAauthenticationResult();
            if (typeof bearerHeader !== 'undefined') {
                var bearer = bearerHeader.split(" ");
                bearerToken = bearer[1];
                result.token = bearerToken;
                //get key and decode message

                this.decodeToken(bearerToken)
                    .then(decode => {
                        result.decodedToken = decode;
                        result.isAuthorized=true;
                        resolve(result)
                    })
                    .catch((err) => {
                        if (err.name == "TokenExpiredError") {
                            console.error("User is trying to access api with an expired token");
                        }
                        result.isAuthorized = false;
                        resolve(result);
                    })

            } else {
                result.isAuthorized = false;
                resolve(result);
            }
        });

    }

    public getUserDetailsFromToken = async (token: string): Promise<{ userId: number }> => {
        let bearer = token.split(" ");
        return await this.decodeToken(bearer[1]);
    }


    private createTokenWithExpire = (data: any, expires: string): string => {
        var key = process.env.jwt_token_secret;
        let token = null
        if(expires){
            token = jwtToken.sign({
                iss: "all",
                data: data
            }, key,
            {
                expiresIn: expires
            });
        }else{
            token = jwtToken.sign({
                iss: "all",
                data: data
            }, key);
        }
        
        return token;
    }

    private isUserBlocked = async (userId: number): Promise<boolean> => {
        let results = await request
            .post(process.env.storageApiBase + "users/isUserBlocked")
            .send({
                userId: userId
            });

        return results.body.Blocked;
    }

    private decodeToken = (bearerToken: string): Promise<{ userId: number }> => {
        return new Promise<{ userId: number }>((resolve, reject) => {
            jwtToken.verify(bearerToken, process.env.jwt_token_secret, (err, decoded: { data: { userId: number } }) => {
                if (err) {
                    if (err.name == "TokenExpiredError") {
                        console.error("User is trying to access api with an expired token");
                    }
                    reject(err);
                }
                else {
                    resolve(decoded.data);
                }
            });
        });
    }

    // private getUserRole = async (roleId):Promise<Role> =>{
    //     let results =  await request
    //         .post(process.env.storageApiBase + "roles/getRolesListByWhere")
    //         .send({
    //             whereQuery:{
    //                 id:roleId
    //             }
    //         });
    //
    //     return results.body.roles[0];
    // }
}