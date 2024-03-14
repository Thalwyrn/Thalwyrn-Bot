import { Message } from "discord.js";
import * as chrono from "chrono-node";
import moment from "moment-timezone";
import * as UserTimezone from "../models/UserTimezone";
import FetchEnvs from "./FetchEnvs";
const env = FetchEnvs();

export default async function (message: Message | string | { content: string, author: { id: string }}): Promise<
  | {
      success: true;
      message: string;
      date: Date;
      seconds: number;
    }
  | {
      success: false;
      message: string;
      date: null;
      seconds: null;
    }> {

  const content = typeof message === "string" ? message : message.content;
  const author = typeof message === "string" ? { id: undefined } : message.author;
      
  // Try to parse the date from the message
  let parsed = chrono.uk.parse(content, {
    timezone: 0 // Parse all dates in UTC, we'll apply the timezone offset later
  })[0];

  console.log(parsed);

  // If we couldn't parse a date, return an error
  if (!parsed)
    return {
      success: false,
      message: "I couldn't parse a date from that message.",
      date: null,
      seconds: null,
    };

  // Get the default timezone from the environment
  let tz = env.DEFAULT_TIMEZONE;

  // If we have an author, check if they have a timezone set
  const authorId = author.id; 
  if(authorId) {
    try {
      const query = UserTimezone.default.findOne({ userId: authorId });
      const response = await query.exec();

      if (!response) {
        console.log("No timezone found, assuming ", tz);
      } else {
        tz = response.timezone;
      }
    } catch (e) {
      console.error(e);
    }
  }

  // Apply the timezone offset to the date
  const tzOffset = moment.tz(tz).utcOffset();

  // Convert the parsed date to a moment object
  let date = moment.utc(parsed.start.date());
  // @ts-ignore
  if (parsed.start.knownValues.timezoneOffset === undefined) {
    console.log("No timezone offset found in the message, subtracting", tzOffset, "minutes to account for the timezone. . . (", tz, ")");
    date = date.add(-tzOffset, "minutes");
  }

  // Return the parsed date with the seconds since epoch
  return {
    success: true,
    message: parsed.text,
    date: date.toDate(),
    seconds: Math.round(date.valueOf() / 1000),
  };
}
