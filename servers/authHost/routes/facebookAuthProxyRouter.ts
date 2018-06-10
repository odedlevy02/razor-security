import {Router} from "express";
import * as express from "express";
import * as request from "superagent";

export class FacebookAuthProxyRouter{
    router: Router;

    constructor() {
        this.router = express.Router();
        this.createRoutes();
    }

    private createRoutes() {
        this.router.get('/', this.facebookLogin)
        this.router.get('/callback', this.facebookCallBack)
    }

    private facebookLogin = (req, res, next) => {
        let loginUrl = process.env.AUTH_SERVICE + "/auth/facebook";
        request.get(loginUrl )
            .then((response) =>{
                res.redirect((response as any).redirects[0]);
            },err=>{
                res.status(500).send(err.message)
            });
    }

    private facebookCallBack = async (req, res) => {
        let callbackUrl = process.env.AUTH_SERVICE + req.originalUrl;
        request
            .get(callbackUrl)
            .then(async (response) =>{
                if(response.body.loginResult && response.body.isValid==false) {
                    res.redirect("/#login?error=" + response.body.error);
                }else{
                    let userInfo = JSON.stringify(response.body.userInfo)
                    res.redirect(`/#login?access_token=${response.body.tokenRes.token};userInfo=${userInfo}`);
                }

            }).catch(err=>{
            res.redirect(res.redirect(`/#login#error=${err.message}`));
        });
    }
}
export const facebookAuthProxyRouter = new FacebookAuthProxyRouter().router;
//Note - add to server.ts method setRoutes:  this.app.use("/auth/facebook",facebookAuthProxyRouter);