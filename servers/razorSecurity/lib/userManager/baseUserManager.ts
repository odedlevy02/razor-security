import * as request from "superagent"
import * as bcrypt from "bcrypt-nodejs";
import { BearerAuthManager } from "../bearerAuthManager";
import { IUserInfo } from "../dataModels/IUserInfo";
import { IUserManager } from "../dataModels/IUserManager";
import { ILoginResult } from "../dataModels/ILoginResult";

export abstract class BaseUserManager implements IUserManager {


    constructor(private userIdentifierField: string) {
        if (!process.env.USER_LOOPBACK_DAL) {
            throw new Error("Env variable 'USER_LOOPBACK_DAL' is mandatory. Define the url link to loopback user table")
        }
    }

    getDalUrl() {
        return process.env.USER_LOOPBACK_DAL
    }

    addUpdateUser = (userInfo: Partial<IUserInfo>): Promise<any> => {
        if (userInfo.id) {
            return this.updateUser(userInfo)
        } else {
            return this.addUser(userInfo)
        }
    }

    //reset password should be used only by administrators
    //this will enable to set a new password to a user without knowing his previous password
    resetPassword = async (userIdentifierVal: string, newPassword: string) => {
        try {
            let user = await this.getUserByKey(userIdentifierVal)
            if (!user) {
                throw "Failed to login. email or password are not valid";
            }
            user.password = bcrypt.hashSync(newPassword)
            let updatedUser = await request.patch(this.getDalUrl()).send(user).then(res => res.body);
            return { succeeded: true };
        } catch (err) {
            console.log("BaseUserManager.resetPassword - error when resetting ",err)
            throw err;
        }
    }

    changePassword = async (userIdentifierVal: string, oldPassword: string, newPassword: string) => {
        let user = await this.getUserByKey(userIdentifierVal)
        if (!user) {
            throw "Failed to login. email or password are not valid";
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
        if (userInfo.password) {
            delete userInfo.password
        }
        this.setUserKeyToLowerCase(userInfo);
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
            console.log(`BaseUserManager.addUser - user ${userKeyVal} not added. Already exists in db`);
            throw new Error("User already exists in system")
        } else {
            this.hashPassword(userInfo)
            return this.addUserToDb(userInfo).then(res => {
                console.log(`BaseUserManager.addUser - user ${userKeyVal} was added to db`);
                return res;
            }).catch(err => {
                console.error(`addUser.addUser - Failed adding user ${userKeyVal} to db. Error: ${err.message}`);
            });
        }
    }

    private hashPassword = (userInfo: Partial<IUserInfo>) => {
        if (userInfo.password) {
            userInfo.password = bcrypt.hashSync(userInfo.password)
        }
    }

    private setUserKeyToLowerCase = (userInfo: any) => {
        //set the key to lower case since we do not want it to be case sensitive
        if (typeof userInfo[this.userIdentifierField] == "string") {
            userInfo[this.userIdentifierField] = userInfo[this.userIdentifierField].toLowerCase();
        }
    }

    private addUserToDb = (userInfo: Partial<IUserInfo>): Promise<any> => {
        this.setUserKeyToLowerCase(userInfo);
        return request.post(this.getDalUrl()).send(userInfo).then(res => res.body);
    }

    loginLocal = async (userNameVal: string, password): Promise<ILoginResult> => {
        let user = null
        try {
            user = await this.getUserByKey(userNameVal)
        } catch (err) {
            console.error(`BaseUserManager.loginLocal - error when calling api. Make sure that the api: ${this.getDalUrl()} is correct and the service is running`);
            return { isValid: false, error: "Failed to login. There was an internal server error. View logs or advise with your administrator" }
        }
        if (!user) {
            return { isValid: false, error: "Failed to login. email or password are not valid" };
        }
        //compare password to hashed password
        var isPasswordCorrect = bcrypt.compareSync(password, user.password);
        if (isPasswordCorrect) {
            return this.createLoginResult(user)
        } else {

            return { isValid: false, error: "Failed to login. email or password are not valid" }
        }
    }

    //When loging in social need to insert the user details when first time log in and later on to approve
    loginSocial = async (socialType: string, email: string, profile: any): Promise<ILoginResult> => {
        let user = await this.getUserByKey(email)
        if (!user) {//first time log in - create the new user
            let userInfo = this.fillUserInfoFromSocialLogin(socialType, email, profile)
            user = await this.addUserToDb(userInfo)
            return this.createLoginResult(user)
        } else {
            return this.createLoginResult(user)
        }
    }

    public createLoginResult = (dbUser: any): ILoginResult => {
        let token = new BearerAuthManager().createToken(this.getUserDataForToken(dbUser), this.tokenExpirationTime)
        let userInfo = this.getUserDataForDisplay(dbUser);
        return {
            isValid: true,
            userInfo,
            tokenRes: { token: token }
        }
    }


    //returning a numeric value will translate to seconds
    //return a string for special times such as 10d, 5h
    //return null for never expiring tokens
    abstract get tokenExpirationTime()
    abstract getUserDataForDisplay(dbUser: any): any;
    abstract getUserDataForToken(dbUser: any): any;
    //Method to be implemented by user. Will be called before saving user info to db and enables the developer to view the user info
    //prior to saving them to the database. It is also possible to add a defaulr role before creating user
    abstract fillUserInfoFromSocialLogin(socialProviderType: string, userIdentifierVal: string, profile: any): any;

    private getUserByKey = (userIdentifierVal: string): Promise<IUserInfo> => {
        let filter = { where: {} }
        //set the key to lower case since we do not want it to be case sensitive 
        if (typeof userIdentifierVal == "string") {
            userIdentifierVal = userIdentifierVal.toLowerCase();
        }
        filter.where[this.userIdentifierField] = userIdentifierVal
        return request.get(this.getDalUrl()).send({ filter }).then(res => {
            let users = res.body;
            if (users.length > 0) {
                return users[0];
            } else {
                return null;
            }
        })
    }

}

