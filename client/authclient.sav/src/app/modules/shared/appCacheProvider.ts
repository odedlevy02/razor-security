import {Injectable} from '@angular/core';

@Injectable()
export class AppCacheProvider{
  isLoggedIn=()=>true
  saveToken=(token:string,expiry?:string)=>{}
  saveUserDetails=(userInfo:any)=>{
    let jsonStr = '{"' + decodeURI(location.search.substring(1).replace(/&/g, "\",\"").replace(/=/g, "\":\"")) + '"}'
    let json = JSON.parse(jsonStr)
    //let json = JSON.parse(userInfo)
    console.log(json)
  }

}



