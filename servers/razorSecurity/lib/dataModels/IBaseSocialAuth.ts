export interface IBaseSocialAuth{
    provider:string
    getSocialUserRole(provider:string,profile:any):number;
}