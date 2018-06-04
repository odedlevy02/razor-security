import {NgModule} from '@angular/core';

import {LoginComp} from './login.comp';
import {RouterModule, Routes} from "@angular/router";
import {SharedModule} from "../shared/shared.module";
import {AuthenticationCallbackActivateGuard} from "../shared/auth/auth-guard-provider";
import {AuthGuardLoginProvider} from "../shared/auth/authGuardLoginProvider";

const loginRoutes: Routes = [
  {path:'login', component:LoginComp,canActivate:[AuthGuardLoginProvider]}
];


@NgModule({
  imports: [RouterModule.forChild(loginRoutes),SharedModule ],
  exports: [],
  declarations: [LoginComp],
  providers: [],
})
export class LoginModule {
}
