import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';


import { AppComponent } from './app.component';
import {HttpClientModule} from "@angular/common/http";
import {HashLocationStrategy, LocationStrategy} from "@angular/common";
import {LoginModule} from "./modules/login/login.module";
import {DashboardModule} from "./modules/dashboard/dashboard.module";
import {RouterModule, Routes} from "@angular/router";
import {SharedModule} from "./modules/shared/shared.module";

const defaultRoutes: Routes = [
  {path:'', redirectTo:"/dashboard",pathMatch:"full"}
];

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    RouterModule.forRoot(defaultRoutes),
    BrowserModule,HttpClientModule,LoginModule,DashboardModule,SharedModule
  ],
  providers:[
    {provide: LocationStrategy, useClass: HashLocationStrategy}
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
