export const Intent = Object.freeze({
    "SUMMARIZE": "summarize",
    "TRANSLATE": "translate",
    "EXTEND": "extend"
});

export const parseMessage = (message, search) => {
    const value = message.toLowerCase();
    const pattern = `\\B${search}\\b`;
    const regex = new RegExp(pattern);
    const matches = value.match(regex);

    if (matches) {
        return matches;
    }
    return null;
};