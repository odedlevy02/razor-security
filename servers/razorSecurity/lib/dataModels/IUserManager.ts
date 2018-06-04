import {IUserInfo} from "./IUserInfo";
import {ILoginResult} from "./ILoginResult";

export interface IUserManager{
    addUpdateUser (userInfo: Partial<IUserInfo>): Promise<any>,
    changePassword (userNameVal: string, oldPassword: string, newPassword: string)
    loginLocal (userNameVal: string, password): Promise<ILoginResult> ,
    loginSocial (socialType:string,userNameVal: string, additionalData: any,roleId:number): Promise<ILoginResult>
}