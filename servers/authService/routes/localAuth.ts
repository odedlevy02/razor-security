import {socialKeys} from "../config/socialKeys";
import {UserManager} from "../managers/userManager";
import { BaseLocalAuth } from "razor-security";

export class LocalAuth extends BaseLocalAuth{
    constructor(){
        super(socialKeys.local,new UserManager(socialKeys.local.userNameField))
    }
}

export const localAuthRouter= new LocalAuth().router;