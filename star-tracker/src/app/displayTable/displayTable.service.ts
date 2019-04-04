import { Injectable } from "@angular/core";

/**
 * Service to return star data to the table
 */
@Injectable()
export class DisplayTableService {
    getStarData() {
        return [
            {
                Constellation: "Andromeda",
                Star: "Almaak",
                rightAscension: "2h 4m",
                declination: "42.3°"
            },
            {
                Constellation: "Andromeda",
                Star: "Alpheratz",
                rightAscension: "0h 8m",
                declination: "29.1°"
            }
        ]
    }
}
