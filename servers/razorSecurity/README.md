# razor-security

## overview
This package makes it easy to add support for social and local authentication based on OAuth 2.0.
It wraps up the messy logic related to routes and assumes the usage of Loopback as the dal layer. It also uses jwt to create a token once user is authenticated.

The git contains a full project sample including an Angular 5 client app.

In general I prefer to wrap logic inside a self hosted microservice and therefore I can rest assure that I can resuse the service cross projects.

The project is build as following:
1. A node service for hosting the client app and is also used as a facade for client requests
2. An Auth service. This service will use the razor-security npm package for encapsulating most of the social logic required. the user can then override the parts that are specific to each project sucs as user management logic.
3. A simple Loopback data access microservice for exposing user related rest calls

Next I would like to explain the social auth flow:
1. The client app requests to authenticate itself according to a certain provider (e.g. google)
2. It makes a call to the host app which exposes the relevant route
3. The host then delegates the request to the auth service. This is done for both: getting the provider URL and for providing the callback route and handling the providers result

## Coding
### Security Service
Enough is said. Lets start building the app.

I highly recomend using the [rznode](https://www.npmjs.com/package/generator-rznode) npm package for creating the services and [lbts](https://www.npmjs.com/package/generator-lbts) for modifying loopback to a more typescript supportive project.  

As a prerequisite start off by creating a Node host service with Express, and a loopback dal service exposing a user table with at email (mandatory) and password (non mandatory) fields

> Note - make sure to register you app in each social provider and collect the relenvat keys. For details read [this](https://www.djamware.com/post/59a6257180aca768e4d2b132/node-express-passport-facebook-twitter-google-github-login)

1. Create a new Node service for containing the security logic
2. npm install passport razor-security --save
2. Add routes per each provider (including local) and an additional route for the UserManagement
3. Add a manager class for UserManager
4. Add a config folder and inside a .env file. The env file needs to include the following keys:
    1. jwt_token_secret - a secret string for creating the token
    2. BASE_SOCIAL_CALLBACK - the route defined inside the providers and the permitted url
    3. USER_LOOPBACK_DAL - the database loopback service url
    
Now lets fo into the details of the each required file

- UserManager - class for managing users including creating user, login, password encription and changing password. Create 
a UserManager class and extend it with BaseUserManager abstract class. You will be required to implement 2 methods
    1. getUserDataForDisplay(dbUser:any):any - the input is a user from the db. The return value is an object containing user information you want to send
    to the client (e.g. for displaying 'hello Jhon')
    2. getUserDataForToken(dbUser:any):any - same input as previous method. The result is an object that is going to be encryted inside the auth token. The data can later on be deserialized in each user request.
- googleAuthRoute (or any other provider) - Add a class and extend BaseGoogleAuthRoute. 
    1. Add a constructor and inside initialize the super class with 2 parameters
        1. An object of type 'GoogleKeys' containg all the keys required for Google passport provider.
        2. An instance of UserManager defined in previous section. Note the in the UserManager constructer you are required to supply the
            key defined in your database for a unique user (e.g. email or phone number etc)
        ````js
         constructor(){
                super(googleKeys,new UserManager("email"))
            }
        ```` 
    
    2. then export you classes router :
    ````js 
    export const googleAuthRouter= new GoogleAuthRoute().router;
    ````
- localAuthRoute - Add a class extending the BaseLocalAuthRoute 
    1. Add a constructor and inside initialize the super class with 2 parameters
        1. An object of type 'LocalKeys' containg the keys required for Local passport provider.
        2. An instance of UserManager defined in previous section. Note the in the UserManager constructer you are required to supply the 
            key defined in your database for a unique user (e.g. email or phone number etc)
        ````js
         constructor(){
                super(localKeys,new UserManager("email"))
            }
        ```` 
    2. then export you classes router : 
    ````js
    export const localAuthRouter= new LocalAuthRoute().router;
    ````
- userManagerRoute - Add a class extending BaseUserManagerRouter. The constructer expects and instance the UserManager class
then export your class router:
3. then export you classes router :
    ````js 
    export const userManagerRouter= new UserManagerRoute().router;
    ````

Configure existing classes:

- In your server.ts file add a method setting all the routes
````js
setRoutes = () => {
        this.app.use("/auth/google", googleAuthRouter);
        this.app.use("/auth/local", localAuthRouter);
        this.app.use("/userManager",userManagerRouter);
    }
````
 - In addintion you are required to initialize passport so add the following method and call it from you constructor:
 ````js
  //define in imports
  import * as passport from "passport"
  
  //add to class
  private initPassport = () => {
         this.app.use(passport.initialize());
         this.app.use(passport.session());
     }
 ````

### Host service
The host service is required to proxy the calls to the security service.
Add routes per each social provider supported
- GoogleAuthProxyRouter - This class proxies calls to the google passport provider. Here is a full code sample:
````js
import {Router} from "express";
import * as express from "express";
import * as request from "superagent";

class GoogleAuthProxyRouter {

    router: Router;

    constructor() {
        this.router = express.Router();
        this.createRoutes();
    }

    private createRoutes() {
        this.router.get('/', this.googleLogin)
        this.router.get('/callback', this.googleCallBack)
    }

    private googleLogin = (req, res, next) => {
        let loginUrl = process.env.AUTH_SERVICE + "/auth/google";
        request.get(loginUrl )
            .then((response) =>{
                res.redirect((response as any).redirects[0]);
            },err=>{
                res.status(500).send(err.message)
            });
    }

    private googleCallBack = async (req, res) => {
        let callbackUrl = process.env.AUTH_SERVICE + req.originalUrl;
        request
            .get(callbackUrl)
            .then(async (response) =>{
                if(response.body.loginResult && response.body.loginResult.isValid==false) {
                    res.redirect("/#login?error=" + response.body.loginResult.error);
                }else{
                    let userInfo = JSON.stringify(response.body.loginResult.userInfo)
                    res.redirect(`/#login?access_token=${response.body.loginResult.tokenRes.token};userInfo=${userInfo}`);
                }

            }).catch(err=>{
                res.redirect(res.redirect(`/#login#error=${err.message}`));
            });
    }


}

export const googleAuthProxyRouter = new GoogleAuthProxyRouter().router;
//Note - add to server.ts method setRoutes:  this.app.use("/auth/google",googleAuthProxyRouter);

````

- LocalAuthProxyRouter - note that since the local provider does not require a callback the calls are post and not get as in social routes.
This make the use of the results more simple since we do not need to redirect the response rathe send it as a json object.
````js
import {Router} from "express";
import * as express from "express";
import * as request from "superagent";

class LocalAuthProxyRouter{

  router: Router;

  constructor() {
    this.router = express.Router();
    this.createRoutes();
  }

    private createRoutes() {
        this.router.post('/', this.localLogin)
    }

    private localLogin = (req, res, next) => {
        let loginUrl = process.env.AUTH_SERVICE + "/auth/local";
        request.post(loginUrl ).send(req.body)
            .then((response) =>{
                if(response.body.loginResult && response.body.loginResult.isValid==false) {
                    res.status(500).send(response.body.loginResult.error)
                }else{
                    // let authManager = this.getAuthManager();
                    // let token = await authManager.createToken(response.body.user.id,response.body.user.roleId)
                    res.status(200).send({access_token:response.body.loginResult.tokenRes.token});
                }
            },err=>{
                res.status(500).send(err.message)
            })
    }


}

export const localAuthProxyRouter= new LocalAuthProxyRouter().router;
//Note - add to server.ts method setRoutes:  this.app.use("/localAuthProxy",localAuthProxyRouter);

````

The remaining code modification is to set the routes in server.ts.
````js
 public setRoutes=()=>{
      this.app.use("/auth/google",googleAuthProxyRouter);
      this.app.use("/auth/local",localAuthProxyRouter);
  }
````
> Note - the routes here must match the callback routes defined inside the provider since the provider will reroute the callback to this url
    

### Client Side code
In order to except the results I added a Login AuthGuard class extending the CanActivate. This should encapsulate the logic required to handle the servers response in case of a redirect.
Here is the code:   
````js
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
    return this.parseQueryString(pathFragments);
  }

  parseQueryString = (queryString) => {
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

````
Dont forget to add register the service as a provider and then to add it to a list of login route activation: 
````js
const loginRoutes: Routes = [
  {path:'login', component:LoginComp,canActivate:[AuthGuardLoginProvider]}
];
````
>Note there is a lot of work done to parse the result since none of the regular Angular options work when at the end we want to redirect to a different page

### Client side routes to Social login
In the client side when requested to route to the relevant social provider, inside the relevent on 
click method use window.redirect in order to redirect to the host
````js
signInWithGoogle=()=>{
    location.href="/auth/google"; //this is the path we defined in the server to map to google
  }
````

### Advanced features
For those that do not want to use loopback  or if you prefer to override the UserManagemnt logic instead of extending the UserManager class from 
BaseUserManager it is possible to implement the IUserManager interface and implement the required methods. It is also possible to override specific methods if required.

### Additional Security Concerns - Issues to complete the picture

Having the ability to use social log in is an important part of the security processm but to complete
the entire picture there are several other steps that are required including:

1. Intercepting client side http request and adding authorization header to each call. In addition it needs
    to handle cases in which the token expires
2. Server side middleware for receiving client side calls and authenticating them   
3. Role managment on both the server and client. It is important to have the server protected per user role, while on
the client mainly to hide non relevant features, though if the data is protected on the server side then 
at worst the client will see empty pages

#### Client side interception

In Angular it is easy to intercept http calls.You are required to create a class that extends 
'HttpInterceptor' and then to register it.
Here is a code sample of the my implemntation. Note that I use an iternal class for saving and fetching the 
client token from the local storage

````js
import {Injectable} from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor, HttpErrorResponse, HttpResponse
} from '@angular/common/http';

import {Observable} from 'rxjs/Observable';
import {Router} from '@angular/router';
import {AppCacheProvider} from "../providers/app-cache-provider";

@Injectable()
export class TokenInterceptor implements HttpInterceptor {

  constructor(private cacheProvider: AppCacheProvider,
              private router: Router) {
  }

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {

    if (this.cacheProvider) {
      const token = this.cacheProvider.getToken();
      let authString = '';
      if (token) {
        authString = 'Bearer ' + token;
        request = request.clone({headers: request.headers.set('Authorization', `${authString}`)});
      }
    }
    return next.handle(request).do((event: HttpEvent<any>) => {
      if (event instanceof HttpResponse) {
        // do stuff with response if you want
      }
    }, (err: any) => {
      if (err instanceof HttpErrorResponse) {
        if (err.status === 401 || err.status === 403) {
          //key expired - clear token and navigate to login
          this.cacheProvider.clearLocalStorage()
          this.router.navigate(['/login']);
          return Observable.empty();
        } else {
          return Observable.throw(err);
        }
      }
    });
  }
}

````

In addition you need to register the class in the main module :
````js
{provide: HTTP_INTERCEPTORS, useClass: TokenInterceptor, multi: true}
````

#### Server Side Middleware

Once the clinet sends the authorization header we need to add a middleware class that will
validate the token and authorize the call

The middleware will need to take the token and decode it. This logic is implemented inside the 
razor-security package in class 'BearerAuthManager' by calling method 'authenticateCall' 
the result type is : {isAuthorized:boolaean,decodedToken:any}

>Note the decoded data is the same data that had been inserted in UserManager.getUserDataForToken right after user info has been retrieved from the db

Since this class is hosted on a different service then that of the host service you will need to add an api to your security 
microseervice. Here is a code sample:

````js
/**
 * Created by ben.m on 29/12/16.
 */
import {Router} from "express-serve-static-core";
import * as express from "express";
import {BearerAuthManager} from "razor-security"
import {IAauthenticationResult} from "razor-security";


class AuthApi  {

    private _checkModulePermissions:string = "/checkModulePermissions";

    protected _router:Router;


    public getRouter(){
        return this._router;
    }
    private bearerAuthManager:BearerAuthManager;
    constructor( ){
        this._router = express.Router();
        this.configRoutes();
        this.bearerAuthManager = new BearerAuthManager();
    }

    protected configRoutes():void{
        this._router.post("/authenticate",this.authenticateCall)
         //this._router.post("/getUserDetailsFromToken",this.getUserDetailsFromToken);
    }

    private authenticateCall = (req, res,next)  => {
        this.bearerAuthManager.authenticateCall(req.body).then((result:IAauthenticationResult) =>{
            res.json(result);
        }).catch(err => {
            next(err);
        })

    }

}

export const authRoute=new AuthApi().getRouter()


````

 This is my implementation of the AuthenticationMiddleware class, internaly calling the security service:
 
 ````js
 import * as request from "superagent";
 
 export class AuthenticationMiddleware {
 
     constructor(private permittedRoles:any[]=null){
 
     }
 
     authenticateCall = (req, res, next) => {
         const url = `${process.env.SEC_AUTH_URL}/auth/authenticate`;
         request
             .post(url)
             .send(req.headers)
             .end((err, authRes) => {
                 if (err) {
                     res.sendStatus(401, err);
                 } else {
                     if (authRes && authRes.body && authRes.body.isAuthorized) {
                         //if token authorized - validate if required to role authorize
                         if(this.permittedRoles){
                             //extract role id
                             if(authRes.body.decodedToken && authRes.body.decodedToken.roleId){
                                 const userRoleId =authRes.body.decodedToken.roleId;
                                 if(this.permittedRoles.includes(userRoleId)){
                                     req.token = authRes.body.token;
                                     req.decodedToken = authRes.body.decodedToken;
                                     next();
                                 }else{
                                     res.sendStatus(401, new Error("User does not have role privileges for this module"));
                                 }
                             }
                         }else{
                             req.token = authRes.body.token;
                             req.decodedToken = authRes.body.decodedToken;
                             next();
                         }
 
                     }
                     else {
                         res.sendStatus(401, err);
                     }
                 }
             });
     };
 
 }
 
 //export const authMiddleware = new AuthenticationMiddleware().authenticateCall

 ````
 > Note that the constructer can recieve a list of role ids. This will enable to add per role authentication 
 for specific api calls. If no role id is sent then the api will be open to anyone carying a valid token
 
 Now add the middleware to the api route defintion.
 ````js
 this.app.use("/documents",new AuthenticationMiddleware([1,2]).authenticateCall,documentsRouter);
 ````
 
 Not simple but this about wraps it up for now

  
     
 
