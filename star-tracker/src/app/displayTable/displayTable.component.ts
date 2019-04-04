import {Component} from "@angular/core";
import {animate, state, style, transition, trigger} from "@angular/animations";
import {DisplayTableService} from "./displayTable.service";
import {Stars} from "./stars.interface";

@Component({
    selector: "display-table",
    templateUrl: "./displayTable.component.html",
    styleUrls: ["./displayTable.component.css"],
    animations: [
        trigger("detailExpand", [
            state("collapsed", style({height: "0px", minHeight: "0", display: "none"})),
            state("expanded", style({height: "*"})),
            transition("expanded <=> collapsed", animate("225ms cubic-bezier(0.4, 0.0, 0.2, 1)")),
        ]),
    ],
})

export class DisplayTableComponent {
    constructor(private displayTableService: DisplayTableService) {
    }

    columnsToDisplay = ["Constellation", "Star", "Launch"];
    currentDate = new Date();
    expandedElement: Stars | null;
    latitude = 0;
    longitude = 0;
    tableData = this.displayTableService.getStarData();

    /**
     * Calculates the Azimuth and Altitude and calls another function to
     * decide the number of steps stepper motor has to turn
     * @param rightAscension of a star in hours
     * @param declination of a star in degrees
     */
    findObject(rightAscension, declination) {
        const rightAscensionSplit = rightAscension.split(" ");
        const rightAscensionInDegrees = 15 *
            // (parseInt(rightAscensionSplit[0]) + (parseInt(rightAscensionSplit[2])/60));
            (parseInt(rightAscensionSplit[0].split("h")[0]) +
                (rightAscensionSplit[1].split("m")[0] / 60));

        const daysFrom2000 = Math.round((this.currentDate.getTime() - new Date(2000,1,1).getTime())/
            (24*60*60*1000));

        const universalTime = this.currentDate.getHours() + this.currentDate.getMinutes() / 60;
        this.getLocation();

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
        let localSiderealTime = 100.46 + (0.985647 * daysFrom2000) + this.longitude + (15 * universalTime);
        let numberOf360sToBeAdded = Math.ceil(Math.abs(localSiderealTime/360));

        if (localSiderealTime < 0) {
            localSiderealTime = localSiderealTime + numberOf360sToBeAdded*360;
        }
        if (localSiderealTime < 0 || localSiderealTime > 360) {
            if (localSiderealTime > 0) {
                numberOf360sToBeAdded -=1;
            }
            localSiderealTime = localSiderealTime - (360*numberOf360sToBeAdded);
        }

        let hourAngle = localSiderealTime - rightAscensionInDegrees;
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
        const sineAltitude = (Math.sin((declination * 3.14) / 180) * Math.sin((this.latitude * 3.14) / 180)) +
            (Math.cos((declination * 3.14) / 180) * Math.cos((this.latitude * 3.14) / 180) *
                Math.cos((hourAngle * 3.14) / 180));
        const altitude = (Math.asin(sineAltitude) * 180) / Math.PI;

        const cosA = (Math.sin((declination * 3.14) / 180) - (Math.sin((altitude * 3.14) / 180)) *
            Math.sin((this.latitude * 3.14) / 180)) /
            (Math.cos((altitude * 3.14) / 180) * Math.cos((this.latitude * 3.14) / 180));
        let azimuth = (Math.acos(cosA) * 180) / Math.PI;

        if (Math.sin((hourAngle * 3.14) / 180) > 0) {
            azimuth = 360 - azimuth;
        }
    }

    /**
     * Find the current latitude and longitude
     */
    getLocation() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition((position: Position) => {
                    if (position) {
                        this.latitude = position.coords.latitude;
                        this.longitude = position.coords.longitude;
                    }
                },
                (error: PositionError) => console.log(error));
        } else {
            alert("Geolocation is not supported by this browser.");
        }
    }

}