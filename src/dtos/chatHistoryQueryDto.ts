

// Custom Pipe for Date Transformation
export class ParseDatePipe {
  transform(value: string) {
    if (value) {
      try {
        const parsedDate = new Date(value);
        if (isNaN(parsedDate.getTime())) {
          return value; // Return original value if it's not a valid date
        }
        return parsedDate.toISOString().split('T')[0]; // Format to YYYY-MM-DD
      } catch (error) {
        return value; // Return original value if parsing fails.
      }
    }
    return value;
  }
}