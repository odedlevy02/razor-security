import * as express from "express";
import {FacebookKeys} from "../dataModels/ISocialKeys";
import {IUserManager} from "../dataModels/IUserManager";
import {Router} from "express";
import * as passport from "passport"
import * as passportFacebook from "passport-facebook"
import {ILoginResult} from "../dataModels/ILoginResult";
import {IBaseSocialAuthRoute} from "../dataModels/IBaseSocialAuthRoute";

export class BaseFacebookAuthRoute implements  IBaseSocialAuthRoute{
    router: Router;
    provider:string="facebook"
    constructor(private facebookKeys:FacebookKeys,private userManager:IUserManager) {
        this.router = express.Router();
        this.setFacebookStratagy();
        this.createRoutes();

    }

    private createRoutes() {
        this.router.get("/", passport.authenticate(this.provider,{scope:"email"}));
        this.router.get("/callback", passport.authenticate(this.provider, {session:false}),
            function(req:any, res) {
                res.json(req.user);
            });
    }

    private setFacebookStratagy=()=>{
        let FacebookStrategy = passportFacebook.Strategy;
        if(!process.env.BASE_SOCIAL_CALLBACK){
            throw new Error("Env key 'BASE_SOCIAL_CALLBACK' is mandatory and has not been set. Validate to load env variables before importing BaseGoogleAuthRoute")
        }
        let callBack = `${process.env.BASE_SOCIAL_CALLBACK}${this.facebookKeys.callbackURL}`
        passport.use(new FacebookStrategy({
                clientID: this.facebookKeys.clientID,
                clientSecret: this.facebookKeys.clientSecret,
                callbackURL: callBack,  //need to give full url of the host app otherwise passport will redirect to this server and not the host
                profileFields: this.facebookKeys.scope,
                passReqToCallback: true
            },
            async (req,accessToken, refreshToken, profile, cb)=>{
                //try and find if such a user exists in the db. If so return the user
                //do not try and return the token since creation of the token is buisness logic that is located in the hsot service and in addition user info is also returned
                if(profile && profile.emails && profile.emails.length > 0){
                    let email = profile.emails[0].value
                    let loginResult =await this.userManager.loginSocial(this.provider,email,profile)
                    cb(null,loginResult)
                }else{
                    cb(null,<ILoginResult>{isValid:false,error:"social api did not return any email for user"})
                }

            }));

        passport.serializeUser(function(user, cb) {
            cb(null, user);
        });

        passport.deserializeUser(function(obj, cb) {
            cb(null, obj);
        });
    }

}