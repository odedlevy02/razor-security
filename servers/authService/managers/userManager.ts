
import {BaseUserManager} from "razor-security"
//This extends BaseUserManager for login user, creating user and modifying password
//When inherting need to add support for what to wrap in token and what to send back for display
export class UserManager extends BaseUserManager{
    getUserDataForDisplay(dbUser:any){
        return {email:dbUser.email}
    }

    getUserDataForToken(dbUser:any):any{
        return {userId:dbUser.id}
    }
}