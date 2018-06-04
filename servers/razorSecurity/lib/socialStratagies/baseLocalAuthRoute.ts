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
        this.router.post("/", passport.authenticate('local',{ failureRedirect: '/' }), (req:any, res)=> {
            //res.redirect("/login?access=22")
            res.json(req.user)
        });

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

