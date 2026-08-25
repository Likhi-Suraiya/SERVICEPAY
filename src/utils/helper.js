//------------  For get Current Date  ---------------
export const getCurrentDate = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

// Use the function so it's not unused
console.log(getCurrentDate());

//------------  For get Next Week Date  ---------------
export const getNextWeekDate = () => {
  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);
  const year = nextWeek.getFullYear();
  const month = String(nextWeek.getMonth() + 1).padStart(2, "0");
  const day = String(nextWeek.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

// Use the function so it's not unused
console.log(getNextWeekDate());

export const formatDateForAPI = (dateString) => {
  const [year, month, day] = dateString.split("-");
  return `${day}/${month}/${year}`;
};

// Use the function so it's not unused
console.log(formatDateForAPI(getCurrentDate()));

//=============== Convert date from YYYY-MM-DD to DD/MM/YYYY format ===============

export const formatedDateForAPI = (dateString) => {
  if (!dateString) return "";
  const [year, month, day] = dateString.split("-");
  return `${day}/${month}/${year}`;
};

console.log(formatedDateForAPI("2023-10-05"));

// New function to format date for display (DD/MM/YYYY)
export const formatDateForDisplay = (dateString) => {
  if (!dateString) return "";

  // Check if the date is already in DD/MM/YYYY format
  if (dateString.includes("/")) {
    return dateString;
  }

  // Convert from YYYY-MM-DD to DD/MM/YYYY
  if (dateString.includes("-")) {
    const [year, month, day] = dateString.split("-");
    return `${day}/${month}/${year}`;
  }

  return dateString;
};

console.log(formatDateForDisplay("2025-09-09")); // Should output "09/09/2025"

//=============== New Date Utility Functions ===============

// ---------- Get date 15 days ago from current date ----------
export const getDate15DaysAgo = () => {
  const today = new Date();
  const fifteenDaysAgo = new Date(today);
  fifteenDaysAgo.setDate(today.getDate() - 15);

  const year = fifteenDaysAgo.getFullYear();
  const month = String(fifteenDaysAgo.getMonth() + 1).padStart(2, "0");
  const day = String(fifteenDaysAgo.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

// Use the function
console.log(getDate15DaysAgo());

//---------- Get default date range (from: 15 days ago, to: current date) ----------
export const getDefaultDateRange = () => {
  return {
    fromDate: getDate15DaysAgo(),
    toDate: getCurrentDate(),
  };
};

// Use the function
console.log(getDefaultDateRange());

// Format date for input fields (YYYY-MM-DD)
export const formatDateForInput = (dateString) => {
  if (!dateString) return "";

  // If already in YYYY-MM-DD format, return as is
  if (dateString.includes("-") && dateString.split("-")[0].length === 4) {
    return dateString;
  }

  // Convert from DD/MM/YYYY to YYYY-MM-DD
  if (dateString.includes("/")) {
    const [day, month, year] = dateString.split("/");
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }

  return dateString;
};

// Use the function
console.log(formatDateForInput("09/09/2025")); // Should output "2025-09-09"

// Check if date is valid
export const isValidDate = (dateString) => {
  if (!dateString) return false;

  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date);
};

// Use the function
console.log(isValidDate("2025-09-09")); // Should output true
console.log(isValidDate("invalid-date")); // Should output false

// Add days to a date
export const addDaysToDate = (dateString, days) => {
  if (!dateString || !isValidDate(dateString)) return "";

  const date = new Date(dateString);
  date.setDate(date.getDate() + days);

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};
// Use the function
console.log(addDaysToDate("2025-09-09", 7)); // Should output "2025-09-16"

// Subtract days from a date
export const subtractDaysFromDate = (dateString, days) => {
  return addDaysToDate(dateString, -days);
};
// Use the function
console.log(subtractDaysFromDate("2025-09-09", 7)); // Should output "2025-09-02"

// Get start and end of month
export const getStartAndEndOfMonth = (dateString = null) => {
  const date = dateString ? new Date(dateString) : new Date();

  const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
  const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);

  const format = (dateObj) => {
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, "0");
    const day = String(dateObj.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  return {
    startOfMonth: format(startOfMonth),
    endOfMonth: format(endOfMonth),
  };
};
// Use the function
console.log(getStartAndEndOfMonth());

//=============== Time Range Utility Functions ===============

// Convert 4-digit time string (e.g., "0930", "1430") to formatted time (e.g., "09:30", "14:30")
export const formatTimeFromDigits = (timeDigits) => {
  if (!timeDigits) return "";

  const timeStr = timeDigits.toString().padStart(4, "0");
  const hours = timeStr.substring(0, 2);
  const minutes = timeStr.substring(2, 4);
  return `${hours}:${minutes}`;
};
// Use the function
console.log(formatTimeFromDigits("930")); // Should output "09:30"
console.log(formatTimeFromDigits("1430")); // Should output "14:30"

// Get current time in minutes since midnight
export const getCurrentTimeInMinutes = () => {
  const currentTime = new Date();
  const currentHours = currentTime.getHours();
  const currentMinutes = currentTime.getMinutes();

  return currentHours * 60 + currentMinutes;
};
// Use the function
console.log(getCurrentTimeInMinutes());

// Convert 4-digit time string to minutes since midnight
export const convertTimeToMinutes = (timeDigits) => {
  if (!timeDigits) return 0;

  try {
    const timeStr = timeDigits.toString().padStart(4, "0");
    const hours = parseInt(timeStr.substring(0, 2));
    const minutes = parseInt(timeStr.substring(2, 4));

    return hours * 60 + minutes;
  } catch (error) {
    console.error("Error converting time to minutes:", error);

    return 0;
  }
};
// Use the function
console.log(convertTimeToMinutes("930")); // Should output 570 (9*60 + 30)
console.log(convertTimeToMinutes("1430")); // Should output 870 (14*60 + 30)

// Check if current time is within the specified time range
export const isWithinTimeRange = (startTimeDigits, endTimeDigits) => {
  // If no time restrictions, return true
  if (!startTimeDigits || !endTimeDigits) {
    return true;
  }

  try {
    const currentTimeInMinutes = getCurrentTimeInMinutes();
    const startTimeInMinutes = convertTimeToMinutes(startTimeDigits);
    const endTimeInMinutes = convertTimeToMinutes(endTimeDigits);
    console.log(`Current time in minutes: ${currentTimeInMinutes}`);
    console.log(
      `Time range: ${startTimeInMinutes} - ${endTimeInMinutes} minutes`
    );
    console.log(
      `Time range formatted: ${formatTimeFromDigits(
        startTimeDigits
      )} - ${formatTimeFromDigits(endTimeDigits)}`
    );

    // Handle cases where time range crosses midnight
    if (endTimeInMinutes < startTimeInMinutes) {
      // Time range crosses midnight (e.g., 2300 to 0200)
      return (
        currentTimeInMinutes >= startTimeInMinutes ||
        currentTimeInMinutes <= endTimeInMinutes
      );
    } else {
      // Normal time range within the same day
      return (
        currentTimeInMinutes >= startTimeInMinutes &&
        currentTimeInMinutes <= endTimeInMinutes
      );
    }
  } catch (error) {
    console.error("Error checking time range:", error);

    return true; // If there's an error, allow the operation
  }
};
// Use the function
console.log(isWithinTimeRange("900", "1700")); // Check if current time is between 9:00 and 17:00

// Get formatted time range for display
export const getFormattedTimeRange = (startTimeDigits, endTimeDigits) => {
  if (!startTimeDigits || !endTimeDigits) {
    return "No time restrictions";
  }

  const startTime = formatTimeFromDigits(startTimeDigits);
  const endTime = formatTimeFromDigits(endTimeDigits);

  return `${startTime} - ${endTime}`;
};
// Use the function
console.log(getFormattedTimeRange("900", "1700")); // Should output "09:00 - 17:00"

// Validate time digits format (4 digits, valid time)
export const isValidTimeDigits = (timeDigits) => {
  if (!timeDigits) return false;

  const timeStr = timeDigits.toString().padStart(4, "0");
  const hours = parseInt(timeStr.substring(0, 2));
  const minutes = parseInt(timeStr.substring(2, 4));

  return hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59;
};
// Use the function
console.log(isValidTimeDigits("2360")); // Should output false (60 minutes is invalid)
console.log(isValidTimeDigits("2359")); // Should output true


  //=================== Date Formatter Method (10T15:07:41/12/2025 to 12/9/2025 5:17:35 PM) ===================
  export const formatDateTime = (dateString) => {
    if (!dateString) return "";
    
    try {
      // Check if the date string contains "T" format (ISO-like: 10T15:07:41/12/2025)
      if (dateString.includes('T') && dateString.includes('/')) {
        // Parse the unusual format: "10T15:07:41/12/2025"
        const parts = dateString.split('T');
        if (parts.length === 2) {
          const day = parts[0];
          const timeAndRest = parts[1].split('/');
          if (timeAndRest.length === 3) {
            const time = timeAndRest[0];
            const month = timeAndRest[1];
            const year = timeAndRest[2];
            
            // Create Date object from parsed parts
            const date = new Date(`${year}-${month}-${day}T${time}`);
            
            // Format to "MM/DD/YYYY h:mm:ss A" format
            return date.toLocaleDateString('en-US', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
            }) + ' ' + date.toLocaleTimeString('en-US', {
              hour12: true,
              hour: 'numeric',
              minute: '2-digit',
              second: '2-digit'
            });
          }
        }
      }
      
      // Fallback: Try parsing as regular Date
      const date = new Date(dateString);
      if (!isNaN(date.getTime())) {
        return date.toLocaleDateString('en-US', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
        }) + ' ' + date.toLocaleTimeString('en-US', {
          hour12: true,
          hour: 'numeric',
          minute: '2-digit',
          second: '2-digit'
        });
      }
      
      return dateString; // Return original if can't parse
    } catch (error) {
      console.error("Error formatting date:", error, dateString);
      return dateString; // Return original on error
    }
  };
