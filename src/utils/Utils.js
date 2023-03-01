export const dateHelper = (date) => {
    const formatNumber = (number) => {
        return number.toLocaleString('en-US', {
            minimumIntegerDigits: 2,
            useGrouping: false
        })
    };

    const [month, day, year] = [formatNumber(date.getMonth() + 1), formatNumber(date.getDate()), date.getFullYear()];
    const [hour, minutes, seconds] = [formatNumber(date.getHours()), formatNumber(date.getMinutes()), formatNumber(date.getSeconds())];

    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    return hour + ":" + minutes + " " + day + " " + months[month-1];
};
