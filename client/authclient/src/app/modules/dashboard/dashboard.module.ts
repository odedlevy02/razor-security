import {NgModule} from '@angular/core';

import {DashboardComp} from './dashboard.comp';
import {RouterModule, Routes} from "@angular/router";
import {SharedModule} from "../shared/shared.module";
import {AuthenticationCallbackActivateGuard} from "../shared/auth/auth-guard-provider";

const dashRoutes: Routes = [
  {path:'dashboard', component:DashboardComp,canActivate:[AuthenticationCallbackActivateGuard]}
];

@NgModule({
  imports: [RouterModule.forChild(dashRoutes),SharedModule ],
  exports: [],
  declarations: [DashboardComp],
  providers: [],
})
export class DashboardModule {
}
