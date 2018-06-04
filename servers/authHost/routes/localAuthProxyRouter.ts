import {Router} from "express";
import * as express from "express";
import * as request from "superagent";

class LocalAuthProxyRouter{

  router: Router;

  constructor() {
    this.router = express.Router();
    this.createRoutes();
  }

    private createRoutes() {
        this.router.post('/', this.localLogin)
    }

    private localLogin = (req, res, next) => {
        let loginUrl = process.env.AUTH_SERVICE + "/auth/local";
        request.post(loginUrl ).send(req.body)
            .then((response) =>{
                if(response.body.loginResult && response.body.loginResult.isValid==false) {
                    res.status(500).send(response.body.loginResult.error)
                }else{
                    // let authManager = this.getAuthManager();
                    // let token = await authManager.createToken(response.body.user.id,response.body.user.roleId)
                    res.status(200).send({access_token:response.body.loginResult.tokenRes.token});
                }
            },err=>{
                res.status(500).send(err.message)
            })
    }


}

export const localAuthProxyRouter= new LocalAuthProxyRouter().router;
//Note - add to server.ts method setRoutes:  this.app.use("/localAuthProxy",localAuthProxyRouter);
