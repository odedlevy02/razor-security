import {UserManager} from "../managers/userManager";
import {socialKeys} from "../config/socialKeys";
import { BaseUserManagerRouter } from "razor-security";
export class UserManagerRouter extends BaseUserManagerRouter {
    constructor(){
        super(new UserManager(socialKeys.local.userNameField))
    }
}

export const userManagerRouter= new UserManagerRouter().router;