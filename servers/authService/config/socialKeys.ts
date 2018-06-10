export const socialKeys={
    google:{
        clientID: "32794788829-iddj9d6krtutlaqr7jq79a47vp7irdnu.apps.googleusercontent.com",
        clientSecret: "jDQLuO9XanPK9O-NZx1W0xMW",
        callbackURL:"/auth/google/callback",
        scope:['email','profile']
    },
    facebook:{
        clientID: "793904600803414",
        clientSecret: "1fa053891ee4d4486fd6440c5a81207f",
        callbackURL:"/auth/facebook/callback",
        scope:["email","displayName"]
    },
    local:{
        userNameField:"email",
        passwordField:"password"
    }
}