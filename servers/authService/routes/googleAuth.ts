import {socialKeys} from "../config/socialKeys";
import {UserManager} from "../managers/userManager";
import { BaseGoogleAuth } from "razor-security";

export class GoogleAuth extends BaseGoogleAuth{
    constructor(){
        super(socialKeys.google,new UserManager(socialKeys.local.userNameField))
    }

    getSocialUserRole(provider:string,profile:any): number {
        return 2;
    }
}
export const googleAuthRouter= new GoogleAuth().router;