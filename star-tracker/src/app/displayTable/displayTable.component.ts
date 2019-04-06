import {Component, ViewChild} from "@angular/core";
import {animate, state, style, transition, trigger} from "@angular/animations";
import {MatTableDataSource} from '@angular/material';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import {DisplayTableService} from "./displayTable.service";
import {Stars} from "./stars.interface";


@Component({
    selector: "display-table",
    templateUrl: "./displayTable.component.html",
    styleUrls: ["./displayTable.component.css"]
})

export class DisplayTableComponent {
    displayedColumns: string[] = ['Constellation', 'Star', "Launch"];
    dataSource = new MatTableDataSource(this.displayTableService.getStarData());
    applyFilter(filterValue: string) {
        this.dataSource.filter = filterValue.trim().toLowerCase();
    }
    currentDate = new Date();
    latitude = 0;
    longitude = 0;
    azimuth = 0;
    altitude = 0;
    
    constructor(private displayTableService: DisplayTableService,
        private httpClient: HttpClient) {
        this.getLocation();
    }

    
    /**
     * Calculates the Azimuth and Altitude and calls another function to
     * decide the number of steps stepper motor has to turn
     * @param rightAscension of a star in hours
     * @param declination of a star in degrees
     */
    findObject(rightAscension, declination) {
        /**
         * Save previous Azimuth and Altitude of a star for hopping
         */
        const previousAzimuth = this.azimuth;
        const previousAltitude = this.altitude;

        /**
         * Calculate RightAscension of a star in degrees
         */
        const rightAscensionInDegrees = 15 * (parseInt(rightAscension.h) + (parseInt(rightAscension.m)/60));

        /**
         * Number of days to the current date from year 2000
         */
        const daysFrom2000 = Math.round((this.currentDate.getTime() - new Date(2000,1,1).getTime())/
            (24*60*60*1000));

        
        /**
         * Suppose you have a sunny morning. Put a stick in the ground, and watch
         * the shadow. The shadow will get shorter and shorter - and then start to
         * get longer and longer. The time corresponding to the shortest shadow is
         * your local noon. We reckon a Solar day as (roughly) the mean time between
         * two local noons, and we call this 24 hours of time.
         *
         * The stars keep a day which is about 4 minutes shorter than the Solar day.
         * This is because during one day, the Earth moves in its orbit around the
         * Sun, so the Sun has to travel a bit further to reach the next day's noon.
         * The stars do not have to travel that bit further to catch up - so the
         * sidereal day is shorter.
         * We need to be able to tell time by the stars, and the sidereal time can
         * be calculated from a formula which involves the number of days from the
         * epoch J2000. An approximate version of the formula is:
         * LST = 100.46 + 0.985647 * d + long + 15*UT
         *      where,
         *      d = the days from J2000, including the fraction of a day
         *      UT = universal time in decimal hours
         *      long = your longitude in decimal degrees, East positive.
         */
        const universalTime = this.currentDate.getHours() + (this.currentDate.getMinutes() / 60);
        let localSiderealTime = 100.46 + (0.985647 * daysFrom2000) + this.longitude + (15 * universalTime);
        let numberOf360sToBeAdded = Math.ceil(Math.abs(localSiderealTime/360));

        if (localSiderealTime < 0) {
            localSiderealTime = localSiderealTime + numberOf360sToBeAdded*360;
        }
        if (localSiderealTime > 0) {
            numberOf360sToBeAdded -=1;
            localSiderealTime = localSiderealTime - (360*numberOf360sToBeAdded);
        }
       
        let hourAngle = (localSiderealTime - rightAscensionInDegrees)/15;
        if (hourAngle <= 0) {
            hourAngle += 360;
        }

        /**
         * Calculate Altitude and Azimuth
         * sin(ALT) = sin(DEC)*sin(LAT)+cos(DEC)*cos(LAT)*cos(HA)
         * ALT = asin(ALT)
         *
         *             sin(DEC) - sin(ALT)*sin(LAT)
         *  cos(A) = ---------------------------------
         *                  cos(ALT)*cos(LAT)
         *  A = acos(A)
         *
         *  If sin(HA) is negative, then AZ = A, otherwise
         *  AZ = 360 - A
         */
        const sineAltitude = (Math.sin((parseFloat(declination) * 3.14) / 180) * Math.sin((this.latitude * 3.14) / 180)) +
            (Math.cos((parseFloat(declination) * 3.14) / 180) * Math.cos((this.latitude * 3.14) / 180) *
                Math.cos((hourAngle * 3.14) / 180));
        this.altitude = (Math.asin(sineAltitude) * 180) / Math.PI;

        const cosA = (Math.sin(((parseFloat(declination) * 3.14) / 180) - (Math.sin((this.altitude * 3.14) / 180)) *
            Math.sin((this.latitude * 3.14) / 180)) /
            (Math.cos((this.altitude * 3.14) / 180) * Math.cos((this.latitude * 3.14) / 180)));
        this.azimuth = (Math.acos(cosA) * 180) / Math.PI;

        if (Math.sin((hourAngle * 3.14) / 180) > 0) {
            this.azimuth = 360 - this.azimuth;
        }

        if (this.altitude >= 0) {
            this.calculateDifferenceInDegrees(previousAltitude, this.altitude, previousAzimuth, this.azimuth);
        } else {
            alert("Selected object below horizon. Please select another object.");
        }
    }

    /**
     * Find the current latitude and longitude
     */
    getLocation() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition((position: Position) => {
                    if (position) {
                        console.log("Position", position)
                        this.latitude = position.coords.latitude;
                        this.longitude = position.coords.longitude;
                    }
                },
                (error: PositionError) => console.log(error));
        } else {
            alert("Geolocation is not supported by this browser.");
        }
    }

    calculateDifferenceInDegrees(previousAltitude, currentAltitude, previousAzimuth, currentAzimuth) {
        const differenceInAzimuth = currentAzimuth - previousAzimuth;
        const differenceInAltitude = currentAltitude - previousAltitude;
        const numberOfStepperMotorSteps = 2048;
        const minimumDegreeOfRotationOfMotor = 360/numberOfStepperMotorSteps;


        const numberOfStepsForAzimuthMotor = Math.ceil(differenceInAzimuth/minimumDegreeOfRotationOfMotor);
        const numberOfStepsForAltitudeMotor = Math.ceil(differenceInAltitude/minimumDegreeOfRotationOfMotor);
         console.log("numberOfStepsForAzimuthMotor", numberOfStepsForAzimuthMotor);
        console.log("numberOfStepsForAltitudeMotor", numberOfStepsForAltitudeMotor);
        const httpOptions = {
            headers: new HttpHeaders({ 
                'Access-Control-Allow-Origin':'*'
            })
        };
        return this.httpClient.post(`/steps?azimuthMotorSteps=${numberOfStepsForAzimuthMotor}?altitudeMotorSteps=${numberOfStepsForAltitudeMotor}`, {}, httpOptions).subscribe();       
    }

}