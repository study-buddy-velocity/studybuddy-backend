export const formatTimestampToIOS = (timestamp: string) => {
    if (!timestamp) {
      return null; // Or handle the absence of a timestamp differently
    }

    try {
      const parsedTimestamp = parseInt(timestamp, 10);
      if (isNaN(parsedTimestamp)) {
        return timestamp; // Return original value if parsing fails
      }

      const date = new Date(parsedTimestamp);
      return date.toISOString();
    } catch (error) {
      return timestamp; // Return original value if an error occurs
    }
  }

  export const formatDate = (dateString: string) => {
    try {
      // Extract the numeric timezone offset using regex
      const timezoneMatch = dateString.match(/GMT([+-]\d{4})/);
  
      if (timezoneMatch) {
        const timezoneOffset = timezoneMatch[1];
        //Remove the timezone name from the date string
        dateString = dateString.replace(" " + dateString.split(" ").pop() as string, "");
  
        // Create a Date object. This will interpret the date string according to the provided timezone offset.
        const dateObj = new Date(dateString);
  
        if (isNaN(dateObj.getTime())) {
          console.error("Invalid date value after parsing.");
          return null;
        }
  
        const year = dateObj.getFullYear();
        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
        const day = String(dateObj.getDate()).padStart(2, '0');
  
        return `${year}-${month}-${day}`;
      } else {
        console.error("Timezone offset not found in date string.");
        return null;
      }
    } catch (error) {
      console.error(`Invalid date format: ${dateString}. Error:`, error);
      return null;
    }
  }