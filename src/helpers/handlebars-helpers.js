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
    },
    formatCurrency: function (value) {
        const num = parseFloat(value);
        if (isNaN(num)) return value;
        return num.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    },
    formatDateLong: function (date) {
        const d = new Date(date);
        return d.toLocaleDateString('es-BO', {
            day: '2-digit',
            month: 'long',
            year: 'numeric'
        });
    }, 
    groupByTipo: function (lineas, tipo) {
        if (!Array.isArray(lineas)) return [];
        return lineas.filter(linea => linea.tipoMaterial === tipo);
    },
    formatDateLocal: function (date) {
        if (!date) return '';
        const d = new Date(date);

        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');

        return `${year}-${month}-${day}`; // Formato requerido por <input type="date">
    }
  
};

module.exports = handlebarsHelpers;
