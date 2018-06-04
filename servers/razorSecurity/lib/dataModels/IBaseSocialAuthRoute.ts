export interface IBaseSocialAuthRoute{
    provider:string
    getSocialUserRole(provider:string,profile:any):number;
}