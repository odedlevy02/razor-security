import * as request from "superagent"
import * as bcrypt from "bcrypt-nodejs";
import {BearerAuthManager} from "../bearerAuthManager";
import {IUserInfo} from "../dataModels/IUserInfo";
import {IUserManager} from "../dataModels/IUserManager";
import {ILoginResult} from "../dataModels/ILoginResult";

export abstract class BaseUserManager implements IUserManager{


    constructor(private userIdentifierField:string){
        if(!process.env.USER_LOOPBACK_DAL){
            throw new Error("Env variable 'USER_LOOPBACK_DAL' is mandatory. Define the url link to loopback user table")
        }
    }

    getDalUrl(){
        return process.env.USER_LOOPBACK_DAL
    }

    addUpdateUser = (userInfo: Partial<IUserInfo>): Promise<any> => {
        if (userInfo.id) {
            return this.updateUser(userInfo)
        } else {
            return this.addUser(userInfo)
        }
    }

    changePassword = async (userIdentifierVal: string, oldPassword: string, newPassword: string) => {
        let user = await this.getUserByKey(userIdentifierVal)
        if (!user) {
            throw "Failed to login. email or password are not be valid";
        }
        else {
            //compare password to hashed password
            var isSame = bcrypt.compareSync(oldPassword, user.password);
            if (isSame) {

                user.password = bcrypt.hashSync(newPassword)
                return request.patch(this.getDalUrl()).send(user).then(res => res.body);

            } else {
                throw "email or password are not valid";
            }
        }
    }

    private updateUser = (userInfo: Partial<IUserInfo>): Promise<any> => {
        //remove password if it was sent since to update password need to call changePassword api
        if(userInfo.password) {
            delete userInfo.password
        }
        return request.patch(this.getDalUrl()).send(userInfo).then(res => res.body);

    }

    private addUser = async (userInfo: Partial<IUserInfo>): Promise<any> => {
        //validate user does not exist
        if (!userInfo[this.userIdentifierField]) {
            throw new Error(`user info does not include a ${this.userIdentifierField} with a value`)
        }
        let userKeyVal = userInfo[this.userIdentifierField]
        let user = await this.getUserByKey(userKeyVal)
        if (user) {
            throw new Error("User already exists in system")
        } else {
            this.hashPassword(userInfo)
            return this.addUserToDb(userInfo);
        }
    }

    private hashPassword=(userInfo: Partial<IUserInfo>)=>{
        if (userInfo.password) {
            userInfo.password = bcrypt.hashSync(userInfo.password)
        }
    }

    private addUserToDb=(userInfo: Partial<IUserInfo>):Promise<any> =>{
        return request.post(this.getDalUrl()).send(userInfo).then(res => res.body);
    }

    loginLocal = async (userNameVal: string, password): Promise<ILoginResult> => {
        let user = await this.getUserByKey(userNameVal)
        if (!user) {
            return {isValid: false, error: "Failed to login. email or password are not be valid"};
        }
        //compare password to hashed password
        var isPasswordCorrect = bcrypt.compareSync(password, user.password);
        if (isPasswordCorrect) {
            return this.createLoginResult(user)
        } else {

            return {isValid: false, error: "Failed to login. email or password are not be valid"}
        }
    }

    //When loging in social need to insert the user details when first time log in and later on to approve
    loginSocial = async (socialType:string,email: string, profile: any): Promise<ILoginResult> => {
        let user = await this.getUserByKey(email)
        if (!user) {//first time log in - create the new user
            let userInfo = this.fillUserInfoFromSocialLogin(socialType,email,profile)
            user = await this.addUserToDb(userInfo)
            return this.createLoginResult(user)
        }else{
            return this.createLoginResult(user)
        }
    }

    private createLoginResult=(dbUser:any):ILoginResult=>{
        let token = new BearerAuthManager().createToken(this.getUserDataForToken(dbUser), "10d")
        let userInfo = this.getUserDataForDisplay(dbUser);
        return {
            isValid: true,
            userInfo,
            tokenRes: {token: token}
        }
    }



    abstract getUserDataForDisplay(dbUser:any):any;
    abstract getUserDataForToken(dbUser:any):any;
    abstract fillUserInfoFromSocialLogin(socialProviderType:string,userIdentifierVal: string, profile: any):any;

    private getUserByKey = (userIdentifierVal: string): Promise<IUserInfo> => {
        let filter = {where: {}}
        filter.where[this.userIdentifierField] = userIdentifierVal
        return request.get(this.getDalUrl()).send({filter}).then(res => {
            let users = res.body;
            if (users.length > 0) {
                return users[0];
            } else {
                return null;
            }
        })
    }

}

