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
- googleAuthRoute (or any other provider) - Add a class and extend BaseGoogleAuthRoute. The constructer requires 2 params:
    1. An object of type 'GoogleKeys' containg all the keys required for Google passport provider.
    2. An instance of UserManager defined in previous section. Note the in the UserManager constructer you are required to supply the 
    key defined in your database for a unique user (e.g. email or phone number etc)
    3. then export you classes router : export const googleAuthRouter= new GoogleAuthRoute().router;
- localAuthRoute - Add a class extending the BaseLocalAuthRoute The constructer requires 2 params:
    1. An object of type 'LocalKeys' containg the keys required for Local passport provider.
    2. An instance of UserManager defined in previous section. Note the in the UserManager constructer you are required to supply the 
    key defined in your database for a unique user (e.g. email or phone number etc)
    3. then export you classes router : export const localAuthRouter= new LocalAuthRoute().router;
- userManagerRoute - Add a class extending BaseUserManagerRouter. The constructer expects and instance the UserManager class

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
//Note - add to server.ts method setRoutes:  this.app.use("/googleAuthProxy",googleAuthProxyRouter);

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


### Advanced features
For those that do not want to use loopback  or if you prefer to override the UserManagemnt logic instead of extending the UserManager class from 
BaseUserManager it is possible to implement the IUserManager interface and implement the required methods. It is also possible to override specific methods if required.

  
     
 
