import {socialKeys} from "../config/socialKeys";
import {UserManager} from "../managers/userManager";
import { BaseLocalAuthRoute } from "razor-security";


export class LocalAuth extends BaseLocalAuthRoute{
    constructor(){
        super(socialKeys.local,new UserManager(socialKeys.local.userNameField))
    }
}

export const localAuthRouter= new LocalAuth().router;