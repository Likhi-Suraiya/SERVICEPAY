// greetingHandler.js

const getGreetingMessage = (user, userType) => {
    if (!user) return "👋 Hello!";
    
    const currentTime = new Date();
    const currentHour = currentTime.getHours();
    
    let greeting;
    let name;

    // Format name based on user type
    if (userType === 'H') { // Staff
        name = `Mr.`;
    } else { // Partner
        name = 'Partner';
    }

    if (currentHour >= 5 && currentHour < 12) {
        greeting = 'Good Morning 🌅';
    } else if (currentHour >= 12 && currentHour < 18) {
        greeting = 'Good Afternoon 🌤️';
    } else {
        greeting = 'Good Evening 🌙';
    }

    return `👋 Hello ${name}, ${greeting}!`;
};


export default getGreetingMessage;
