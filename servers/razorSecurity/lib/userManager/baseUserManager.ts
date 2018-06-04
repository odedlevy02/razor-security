import * as request from "superagent"
import * as bcrypt from "bcrypt-nodejs";
import {BearerAuthManager} from "../bearerAuthManager";
import {IUserInfo} from "../dataModels/IUserInfo";
import {IUserManager} from "../dataModels/IUserManager";
import {ILoginResult} from "../dataModels/ILoginResult";

export abstract class BaseUserManager implements IUserManager{


    constructor(private userNameField:string){

    }
    addUpdateUser = (userInfo: Partial<IUserInfo>): Promise<any> => {
        if (userInfo.id) {
            return this.updateUser(userInfo)
        } else {
            return this.addUser(userInfo)
        }
    }

    changePassword = async (userNameVal: string, oldPassword: string, newPassword: string) => {
        let user = await this.getUserByKey(userNameVal)
        if (!user) {
            throw "Failed to login. email or password are not be valid";
        }
        else {
            //compare password to hashed password
            var isSame = bcrypt.compareSync(oldPassword, user.password);
            if (isSame) {
                let url = process.env.USER_LOOPBACK_DAL;
                user.password = bcrypt.hashSync(newPassword)
                return request.patch(url).send(user).then(res => res.body);

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
        let url = process.env.USER_LOOPBACK_DAL;
        return request.patch(url).send(userInfo).then(res => res.body);

    }

    private addUser = async (userInfo: Partial<IUserInfo>): Promise<any> => {
        //validate user does not exist
        if (!userInfo[this.userNameField]) {
            throw new Error(`user info does not include a ${this.userNameField} with a value`)
        }
        let userKeyVal = userInfo[this.userNameField]
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
        let url = process.env.USER_LOOPBACK_DAL;
        return request.post(url).send(userInfo).then(res => res.body);
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
    loginSocial = async (socialType:string,userNameVal: string, additionalData: any,roleId:number): Promise<ILoginResult> => {
        let user = await this.getUserByKey(userNameVal)
        if (!user) {//first time log in - create the new user
            let userInfo = this.fillUserInfoFromSocialLogin(socialType,userNameVal,additionalData)
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



    abstract getUserDataForDisplay(dbUser:any):any
    abstract getUserDataForToken(dbUser:any):any

    //should override per app
    fillUserInfoFromSocialLogin=(socialType:string,userNameVal: string, additionalData: any):Partial<IUserInfo>=>{
        let userInfo={}
        userInfo[this.userNameField]=userNameVal
        return userInfo
    }

    private getUserByKey = (userNameVal: string): Promise<IUserInfo> => {
        let url = process.env.USER_LOOPBACK_DAL
        let filter = {where: {}}
        filter.where[this.userNameField] = userNameVal
        return request.get(url).send({filter}).then(res => {
            let users = res.body;
            if (users.length > 0) {
                return users[0];
            } else {
                return null;
            }
        })
    }

}

