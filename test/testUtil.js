const buildObjectWithoutKey = (obj, key) => {
    const filteredEntries = Object.entries(obj).filter(([k]) => {
        return k !== key;
    });
    return Object.fromEntries(filteredEntries);
};

module.exports = {
    buildObjectWithoutKey,
};
