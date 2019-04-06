import { Injectable } from "@angular/core";
import starCollection  from "./starData";
/**
 * Service to return star data to the table
 */
@Injectable()
export class DisplayTableService {
   
    getStarData() {
        return starCollection;
    }
}
