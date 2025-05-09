const handlebarsHelpers = {
    ifCond: function (v1, operator, v2, options) {
        switch (operator) {
            case '==':
                return (v1 == v2) ? options.fn(this) : options.inverse(this);
            case '===':
                return (v1 === v2) ? options.fn(this) : options.inverse(this);
            case '!=':
                return (v1 != v2) ? options.fn(this) : options.inverse(this);
            case '!==':
                return (v1 !== v2) ? options.fn(this) : options.inverse(this);
            case '<':
                return (v1 < v2) ? options.fn(this) : options.inverse(this);
            case '<=':
                return (v1 <= v2) ? options.fn(this) : options.inverse(this);
            case '>':
                return (v1 > v2) ? options.fn(this) : options.inverse(this);
            case '>=':
                return (v1 >= v2) ? options.fn(this) : options.inverse(this);
            case '&&':
                return (v1 && v2) ? options.fn(this) : options.inverse(this);
            case '||':
                return (v1 || v2) ? options.fn(this) : options.inverse(this);
            default:
                return options.inverse(this);
        }
    },

    json: function (context) {
        return JSON.stringify(context, null, 2);
    },

    range: function (start, end, options) {
        let result = '';
        for (let i = start; i <= end; i++) {
            result += options.fn(i);
        }
        return result;
    },

    sum: function (array, field) {
        if (!Array.isArray(array)) return 0;
        return array.reduce((total, item) => {
            const value = parseFloat(item[field]) || 0;
            return total + value;
        }, 0).toFixed(2); // Con 2 decimales
    }
    
};

module.exports = handlebarsHelpers;
