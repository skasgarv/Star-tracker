import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {MatTableModule} from '@angular/material/table';
import {MatInputModule} from '@angular/material/input';
import { HttpClientModule } from '@angular/common/http';


import { AppComponent } from './app.component';
import { DisplayTableComponent } from "./displayTable/displayTable.component";
import { DisplayTableService } from "./displayTable/displayTable.service";

@NgModule({
  declarations: [
    AppComponent,
    DisplayTableComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    MatTableModule,
    MatInputModule,
    HttpClientModule
  ],
  providers: [DisplayTableService],
  bootstrap: [AppComponent]
})
export class AppModule { }
