import {NgModule} from '@angular/core';
import {AuthenticationCallbackActivateGuard} from "./auth/auth-guard-provider";
import {AppCacheProvider} from "./appCacheProvider";
import {RouterModule} from "@angular/router";
import {AuthGuardLoginProvider} from "./auth/authGuardLoginProvider";

@NgModule({
  imports: [RouterModule ],
  exports: [RouterModule],
  declarations: [],
  providers: [AppCacheProvider,AuthenticationCallbackActivateGuard,AuthGuardLoginProvider],
})
export class SharedModule {
}
