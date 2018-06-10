import {BaseFacebookAuthRoute} from "razor-security";
import {socialKeys} from "../config/socialKeys";
import {UserManager} from "../managers/userManager";

export class FaceBookAuthRoute extends BaseFacebookAuthRoute{
    constructor(){
        super(socialKeys.facebook,new UserManager(socialKeys.local.userNameField))
    }
}

export const facebookAuthRouter= new FaceBookAuthRoute().router;