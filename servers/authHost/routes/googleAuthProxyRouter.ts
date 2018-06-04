import {Router} from "express";
import * as express from "express";
import * as request from "superagent";

class GoogleAuthProxyRouter {

    router: Router;

    constructor() {
        this.router = express.Router();
        this.createRoutes();
    }

    private createRoutes() {
        this.router.get('/', this.googleLogin)
        this.router.get('/callback', this.googleCallBack)
    }

    private googleLogin = (req, res, next) => {
        let loginUrl = process.env.AUTH_SERVICE + "/auth/google";
        request.get(loginUrl )
            .then((response) =>{
                res.redirect((response as any).redirects[0]);
            },err=>{
                res.status(500).send(err.message)
            });
    }

    private googleCallBack = async (req, res) => {
        let callbackUrl = process.env.AUTH_SERVICE + req.originalUrl;
        request
            .get(callbackUrl)
            .then(async (response) =>{
                if(response.body.loginResult && response.body.loginResult.isValid==false) {
                    res.redirect("/#login#error=" + response.body.loginResult.error);
                }else{
                    // let authManager = this.getAuthManager();
                    // let token = await authManager.createToken(response.body.user.id,response.body.user.roleId)
                    let userInfo = JSON.stringify(response.body.loginResult.userInfo)
                    res.redirect(`/#login?access_token=${response.body.loginResult.tokenRes.token};expiry=3300303;userInfo=${userInfo}`);
                }

            });
    }


}

export const googleAuthProxyRouter = new GoogleAuthProxyRouter().router;
//Note - add to server.ts method setRoutes:  this.app.use("/googleAuthProxy",googleAuthProxyRouter);
