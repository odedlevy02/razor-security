import {IUserInfo} from "./IUserInfo";
import {ILoginResult} from "./ILoginResult";

export interface IUserManager{
    addUpdateUser (userInfo: Partial<IUserInfo>): Promise<any>,
    changePassword (userNameVal: string, oldPassword: string, newPassword: string)
    resetPassword (userNameVal: string, newPassword: string)
    loginLocal (userNameVal: string, password): Promise<ILoginResult> ,
    loginSocial (socialType:string,email: string, profile: any): Promise<ILoginResult>
    fillUserInfoFromSocialLogin(socialProviderType:string,userIdentifierVal: string, profile: any):any;
    createLoginResult(dbUser:any):ILoginResult;
}