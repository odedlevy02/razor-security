import {Injectable} from "@angular/core";
import {ActivatedRoute, CanActivate, Router} from "@angular/router";
import {Location} from "@angular/common";
import {AppCacheProvider} from "../appCacheProvider";
import {Observable} from "rxjs/Observable";

@Injectable()
export class AuthGuardLoginProvider implements CanActivate {
  constructor(private router: Router,
              private location: Location,
              private appCacheProvider: AppCacheProvider) {
  }

  canActivate(): Observable<boolean> | Promise<boolean> | boolean {
    const query: any = this.getParsedQueryString();

    if (query.access_token) {
      console.log('token found in query param. Permitting user');
      this.appCacheProvider.saveToken(query.access_token,query.expiry);
      this.appCacheProvider.saveUserDetails(query.userInfo)
      this.router.navigate(['/']);
    } else {
      return true;

    }
  }

  private getParsedQueryString = () => {
    const pathFragments = this.location.path(true);
    return this.parseQueryString2(pathFragments);
  }

  parseQueryString2 = (queryString) => {
    const params = {};
    //remove path until ?
    let startFrom = queryString.indexOf("?")
    if(startFrom>-1){
      let queries = queryString.substring(startFrom+1).split(';');
      queries.forEach(query=>{
        let keyValQuery = query.split("=")
        if(keyValQuery.length==2){
          params[keyValQuery[0]] = keyValQuery[1]
        }
      })
    }

    return params;
  }


}
