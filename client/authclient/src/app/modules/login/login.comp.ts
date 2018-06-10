import {Component, OnInit} from '@angular/core';
import {HttpClient} from "@angular/common/http";

@Component({
  selector: 'login',
  template: `
    <div>I am login</div>
    <button (click)="googleLogin()">Google login</button>

    <button (click)="facebookLogin()">Facebook login</button>

    <button (click)="localLogin()">Local login</button>
  `
})

export class LoginComp implements OnInit {
  constructor(private http:HttpClient) {
  }

  ngOnInit() {
  }

  googleLogin=()=>{
    location.href="/auth/google";
  }

  facebookLogin=()=>{
    location.href="/auth/facebook";
  }

  localLogin=()=>{
    this.http.post("/auth/local",{email:"oded@test2",password:"12345"}).subscribe(res=>{
      console.log(res)
    },err=>{
      console.log(err)
    })
  }
}
