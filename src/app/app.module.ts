import { NgModule } from '@angular/core';
import { BrowserModule, HammerModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { View1Component } from './view1/view1.component';
import { IgxSimpleComboModule, IgxInputGroupModule, IgxListModule, IgxAvatarModule, IgxIconModule, IgxNavbarModule, IgxButtonModule, IgxRippleModule, IgxNavigationDrawerModule } from '@infragistics/igniteui-angular';
import { FormsModule } from '@angular/forms';
import { View2Component } from './view2/view2.component';
import { View3Component } from './view3/view3.component';
import { HttpClientModule } from '@angular/common/http';

@NgModule({
  declarations: [
    AppComponent,
    View1Component,
    View2Component,
    View3Component
  ],
  imports: [
    BrowserModule,
    HammerModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    IgxSimpleComboModule,
    IgxInputGroupModule,
    IgxListModule,
    IgxAvatarModule,
    IgxIconModule,
    FormsModule,
    IgxNavbarModule,
    IgxButtonModule,
    IgxRippleModule,
    IgxNavigationDrawerModule,
    HttpClientModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule {
}
