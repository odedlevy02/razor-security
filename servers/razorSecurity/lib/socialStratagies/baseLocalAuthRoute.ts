import {Router} from "express";
import * as express from "express";
import * as passport from "passport"
import * as localStratagy from "passport-local"
import {GoogleKeys, LocalKeys} from "../dataModels/ISocialKeys";
import {IUserManager} from "../dataModels/IUserManager";

export class BaseLocalAuthRoute {

    router: Router;
    constructor(private localKeys:LocalKeys,private userManager:IUserManager) {
        this.router = express.Router();
        this.setLocalStratagy();
        this.createRoutes();
    }

    private createRoutes() {
        this.router.post("/", passport.authenticate('local',{ failureRedirect: '/' ,session:false}), (req:any, res)=> {
            res.json(req.user)
        });

        this.router.post("/signup",this.signup);

    }

    signup=(req,res,next)=>{
        let userIdentifier = req.body[this.localKeys.userNameField];
        let details = req.body;
        //try adding user. If exists an error will be raised
        let userInfo = this.userManager.fillUserInfoFromSocialLogin("local",userIdentifier ,details)
        this.userManager.addUpdateUser(userInfo).then(addUserRes=>{
            let loginResult = this.userManager.createLoginResult(addUserRes)
            res.status(200).send(loginResult);
        },err=>{
            res.status(500).send({isValid: false, error: "Failed to sign up. User already exists in the system"});
        })
    }


    private setLocalStratagy = () => {
        let LocalStratagy = localStratagy.Strategy;
        passport.use(new localStratagy({
                usernameField: this.localKeys.userNameField,
                passwordField: this.localKeys.passwordField
            },
            async (user, password, done) => {
                let loginResult = await this.userManager.loginLocal(user,password)
                return done(null,loginResult)

            }))

        passport.serializeUser(function(user, done) {
            done(null, user);
        });

        passport.deserializeUser(function(user, cb) {
            cb(null, user);
        });
    }

}

