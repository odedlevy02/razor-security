import {Router} from "express";
import * as express from "express";
import {IUserManager} from "../dataModels/IUserManager";


export class BaseUserManagerRouter {

    router: Router;

    constructor(private userManager:IUserManager) {
        this.router = express.Router();
        this.createRoutes();
    }

    private createRoutes() {
        this.router.post("/addUpdateUser", this.addUpdateUser);
        this.router.post("/changePassword", this.changePassword);
        // //for test only - should be called internaly by passport
        // this.router.post("/loginLocal", this.loginLocal);
        // //for test only - should be called internaly by passport
        // this.router.post("/loginGoogle", this.loginGoogle);

    }

    addUpdateUser = (req, res, next) => {
        this.userManager.addUpdateUser(req.body).then(result=>{
            if(req.body.id){
                res.status(200).send({res: "User has been updated"})
            }else{
                res.status(200).send({res: "User has been created"})
            }

        },err=>{
            res.status(500).send({error: err.message})
        })

    }

    changePassword = (req, res, next) => {
        let user = req.body.user || null;
        let oldPassword = req.body.oldPassword || null;
        let newPassword = req.body.newPassword || null;
        if(!user || ! oldPassword || ! newPassword){
            res.status(500).send({error: "user, oldPassword and newPassword properties are mandatory"})
        }
        else{
            this.userManager.changePassword(user,oldPassword,newPassword).then(result=>{
                res.status(200).send({res: "Password updated successfully"})
            },err=>{
                res.status(500).send({error: err})
            })
        }
    }

    // loginLocal= (req, res, next) => {
    //     let user = req.body.user || null;
    //     let password = req.body.password || null;
    //     if(!user || ! password){
    //         res.status(500).send({error: "user and password properties are mandatory"})
    //     }
    //     else {
    //         this.userManager.loginLocal(user,password).then(result => {
    //             res.status(200).send(result)
    //         }, err => {
    //             res.status(500).send({error: err.message})
    //         })
    //     }
    // }
    //
    // loginGoogle= (req, res, next) => {
    //     res.status(200).send({res: "Response"})
    // }
}

//export const userManagerRouter = new UserManagerRouter().router;
//Note - add to server.ts method setRoutes:  this.app.use("/userManager",userManagerRouter);
