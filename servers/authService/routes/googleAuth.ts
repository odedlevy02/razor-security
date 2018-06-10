import {socialKeys} from "../config/socialKeys";
import {UserManager} from "../managers/userManager";
import {BaseGoogleAuthRoute} from "razor-security";

export class GoogleAuth extends BaseGoogleAuthRoute{
    constructor(){
        super(socialKeys.google,new UserManager(socialKeys.local.userNameField))
    }

}
export const googleAuthRouter= new GoogleAuth().router;