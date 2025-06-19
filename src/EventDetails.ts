import { parseCustomDate } from "./additionalFunctions"

export interface EventDetails {
    eventName: string
    startTime: Date
    endTime: Date
    timezone: string
    eventLocation: string
    description: string
    interval: string
    frequency: number
}

/**
 * Parses a semicolon-separated input string to extract structured event details based on the event type.
 *
 * ### Example:
 * ```ts
 * const baseString = "Team Meeting; 2025-06-20 09:00; 2025-06-20 10:00; Europe/Berlin; Zoom; Discuss roadmap";
 * const event = await extractEventdetails(baseString, "New Event");
 * // Returns: EventDetails object with parsed values
 * ```
 *
 * @param baseString - A semicolon-separated string containing the event attributes.
 *   - For `"New Event"`: `"Event Name; Start Time; End Time; Timezone; Location; Description"`
 *   - For `"New Schedule"`: `"Event Name; Start Time; End Time; Timezone; Location; Description; Interval; Frequency"`
 *
 * @param eventType - A string indicating the event type. Accepts `"New Event"` or `"New Schedule"`.
 * 
 * @returns A `Promise<EventDetails>` object containing the parsed and structured event properties.
 *
 * @remarks
 * - If the timezone field is empty, defaults to `"Europe/Amsterdam"`.
 * - Dates are parsed using `parseCustomDate`, and converted to JavaScript `Date` objects.
 * - If the `eventType` is unrecognized, an empty/default `EventDetails` object is returned and an error is logged.
 * - Used to support both single-instance events and recurring scheduled events.
 *
 * @throws Does not throw; logs errors and returns default fallback object if input is invalid.
 *
 * @dependencies
 * - Requires `parseCustomDate` for date parsing and a `logger` utility.
 * - Assumes `EventDetails` interface is defined and available in scope.
 */
export async function extractEventdetails(baseString: string, eventType: string): Promise<EventDetails> {
    let eventInfoParts: string[] = new Array()
    eventInfoParts = baseString.split("; ")

    // Catch Empty Timezone
    let eventTimezone: string = eventInfoParts[3]!
    if (eventTimezone == "") {
        eventTimezone = "Europe/Amsterdam"
    }

    // Define the remaining attributes
    let eventName: string = eventInfoParts[0]!
    let startTime = new Date(parseCustomDate(eventInfoParts[1]!, eventTimezone!)!)
    let endTime = new Date(parseCustomDate(eventInfoParts[2]!, eventTimezone!)!)
    let location:string = eventInfoParts[4]!
    let eventDescription: string = eventInfoParts[5]!

    // Return the corresponding Event Details as Interface type
    if(eventType == "New Event"){
        return {
        eventName: eventName,
        startTime: startTime,
        endTime: endTime,
        timezone: eventTimezone,
        eventLocation: location,
        description: eventDescription,
        interval: "",
        frequency: 0,
    }
    } 
    else if (eventType == "New Schedule") {
        let eventInterval:string = eventInfoParts[6]!
        let eventIntervalFrequency:number = +eventInfoParts[7]?.trim()!

        return {
            eventName: eventName,
            startTime: startTime,
            endTime: endTime,
            timezone: eventTimezone,
            eventLocation: location,
            description: eventDescription,
            interval: eventInterval,
            frequency: eventIntervalFrequency,
        }
    }
    else {
        // If Input is invalid, return an empty object
        return{
            eventName: "",
            startTime: new Date(),
            endTime: new Date(),
            timezone: "",
            eventLocation: "",
            description: "",
            interval: "",
            frequency: 0,
        }
    }
    
}
