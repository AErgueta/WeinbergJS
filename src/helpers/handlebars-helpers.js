// helpers/handlebars-helpers.js

const handlebarsHelpers = {
  
  ifCond: function (v1, operator, v2, options) {
    switch (operator) {
      case '==': return (v1 == v2) ? options.fn(this) : options.inverse(this);
      case '===': return (v1 === v2) ? options.fn(this) : options.inverse(this);
      case '!=': return (v1 != v2) ? options.fn(this) : options.inverse(this);
      case '!==': return (v1 !== v2) ? options.fn(this) : options.inverse(this);
      case '<': return (v1 < v2) ? options.fn(this) : options.inverse(this);
      case '<=': return (v1 <= v2) ? options.fn(this) : options.inverse(this);
      case '>': return (v1 > v2) ? options.fn(this) : options.inverse(this);
      case '>=': return (v1 >= v2) ? options.fn(this) : options.inverse(this);
      case '&&': return (v1 && v2) ? options.fn(this) : options.inverse(this);
      case '||': return (v1 || v2) ? options.fn(this) : options.inverse(this);
      default: return options.inverse(this);
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

  formatCurrency: function (value) {
    const num = parseFloat(value);
    if (isNaN(num)) return value;
    return num.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  },

  // Formato largo (ej. 20 de diciembre de 2025) - También corregido a UTC
  formatDateLong: function (date) {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('es-BO', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      timeZone: 'UTC' // Importante para evitar desfases
    });
  },

  groupByTipo: function (lineas, tipo) {
    if (!Array.isArray(lineas)) return [];
    return lineas.filter(linea => linea.tipoMaterial === tipo);
  },

  // 👇 FUNCIÓN CORREGIDA: Usa métodos UTC para evitar restar un día
  formatDateLocal: function (date) {
    if (!date) return '';
    const d = new Date(date);
    
    // Al usar getUTC... leemos la fecha tal cual está en la Base de Datos
    const year = d.getUTCFullYear();
    const month = String(d.getUTCMonth() + 1).padStart(2, '0');
    const day = String(d.getUTCDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  },

  getPapelDescripciones: function (lineas) {
    if (!Array.isArray(lineas)) return '';
    const descripciones = lineas
        .filter(linea => linea.tipoMaterial === 'P')
        .map(linea => linea.detalle?.trim()) 

    const unicas = [...new Set(descripciones.filter(Boolean))]; 
    return unicas.join(', ');
  },

  // Helper simple para saber si es módulo
  isModulo: function(tipo) {
      return tipo === 'M'; 
  },
  
  // Helper para sumar propiedades en un array de objetos (usado en reportes/totales)
  sum: function (items, prop) {
    if (!Array.isArray(items)) return 0;
    return items.reduce((a, b) => a + (b[prop] || 0), 0);
  },

  // ... resto de tus helpers ...

  // 👇 Agrega esto para solucionar el error
  add: function (value, addition) {
    return parseInt(value) + parseInt(addition);
  },

  // ... cierre del objeto
  
  // Helper para operaciones matemáticas básicas en las vistas
  math: function(lvalue, operator, rvalue) {
      lvalue = parseFloat(lvalue);
      rvalue = parseFloat(rvalue);
      return {
          "+": lvalue + rvalue,
          "-": lvalue - rvalue,
          "*": lvalue * rvalue,
          "/": lvalue / rvalue,
          "%": lvalue % rvalue
      }[operator];
  }
};

module.exports = handlebarsHelpers;