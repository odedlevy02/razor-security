import {Injectable} from '@angular/core';
import {ActivatedRoute, CanActivate, Router, RouterStateSnapshot} from '@angular/router';
import {Observable} from 'rxjs/Observable';
import {HashLocationStrategy, Location, PathLocationStrategy} from '@angular/common';
import {AppCacheProvider} from "../appCacheProvider";

@Injectable()
export class AuthenticationCallbackActivateGuard implements CanActivate {

    constructor(private router: Router,
                private route: ActivatedRoute,
                private location: Location,
                private appCacheProvider: AppCacheProvider) {
    }

    canActivate(): Observable<boolean> | Promise<boolean> | boolean {
      const query: any = this.getParsedQueryString();

      if (this.appCacheProvider.isLoggedIn()) {
        return  true;
      } else {
        this.router.navigate(['/login']);
        return false;
      }
    }


    private getParsedQueryString = () => {
        const pathFragments = this.location.path(true);
        return this.parseQueryString2(pathFragments);
    }


  // gets a query string and returns an object of key values
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

    // gets a query string and returns an object of key values
    parseQueryString = (queryString) => {
        const params = {};
        let queries, temp, i, l;
        // Split into key/value pairs
        queries = queryString.split(';');
        // Convert the array of strings into an object
        for (i = 0, l = queries.length; i < l; i++) {
            temp = queries[i].split('=');
            params[temp[0]] = temp[1];
        }
        return params;
    }
}
