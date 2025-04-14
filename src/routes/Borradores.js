// cauculatorTres.hbs
// -- Para llenar la fila de Utilidad -- //

// 👉 Nuevo setTimeout para insertar la línea U - Utilidad
setTimeout(() => {
    let codigoCT = "";
    let porcentaje = 0;

    if (lineaCantidad <= 200) {
        codigoCT = "MAU001"; porcentaje = 75;
    } else if (lineaCantidad <= 500) {
        codigoCT = "MAU002"; porcentaje = 70;
    } else if (lineaCantidad <= 1000) {
        codigoCT = "MAU003"; porcentaje = 65;
    } else if (lineaCantidad <= 5000) {
        codigoCT = "MAU004"; porcentaje = 60;
    } else if (lineaCantidad <= 10000) {
        codigoCT = "MAU005"; porcentaje = 56;
    } else if (lineaCantidad <= 30000) {
        codigoCT = "MAU006"; porcentaje = 49;
    } else if (lineaCantidad <= 60000) {
        codigoCT = "MAU007"; porcentaje = 43;
    } else {
        codigoCT = "MAU008"; porcentaje = 75;
    }

    const filas = document.querySelectorAll("#tabla-detalles tbody tr");
    let filaDisponible = null;

    filas.forEach(fila => {
        const tipoSelect = fila.querySelector("select[name='tipoMaterial']");
        if (tipoSelect && tipoSelect.value === "") {
            filaDisponible = fila;
        }
    });

    if (filaDisponible) {
        const inputCodigo = filaDisponible.querySelector("input[name='codigoCT']");
        const inputCantidad = filaDisponible.querySelector("input[name='cantidad']");
        const inputPrecio = filaDisponible.querySelector("input[name='precio']");
        const inputMonto = filaDisponible.querySelector("input[name='monto']");
        const tipoSelect = filaDisponible.querySelector("select[name='tipoMaterial']");

        console.log("📋 Fila encontrada para U:", filaDisponible.innerHTML);
        console.log("✅ inputCodigo:", inputCodigo);
        console.log("✅ inputCantidad:", inputCantidad);
        console.log("✅ inputPrecio:", inputPrecio);
        console.log("✅ inputMonto:", inputMonto);
        console.log("✅ tipoSelect:", tipoSelect);

        if (inputCodigo && inputCantidad && inputPrecio && inputMonto && tipoSelect) {
            // Asignar primero los valores
            tipoSelect.value = "U";
            inputCodigo.value = codigoCT;
            inputCantidad.value = porcentaje; // ahora es el porcentaje editable
            const precio = parseFloat(((s * porcentaje) / 100).toFixed(2));
            inputPrecio.value = precio;
            inputMonto.value = precio;

            // Bloquear todos los campos cantidad primero
            filas.forEach(f => {
                let input = f.querySelector("input[name='cantidad']");
                if (input) input.setAttribute("readonly", true);
            });

            // Ahora sí desbloquear solo la fila U
            inputCantidad.removeAttribute("readonly");

            // Agregar el event listener
            inputCantidad.addEventListener("input", () => {
                let nuevoPorcentaje = parseFloat(inputCantidad.value) || 0;
                let nuevoPrecio = parseFloat(((s * nuevoPorcentaje) / 100).toFixed(2));
                inputPrecio.value = nuevoPrecio;
                inputMonto.value = nuevoPrecio;
            });

        } else {
            console.warn("⚠️ No se encontraron todos los campos necesarios en la fila U.");
        }
    } else {
        console.warn("❌ No se encontró una fila vacía para asignar la Utilidad.");
    }
}, 500); // Espera leve para que s y lineaCantidad ya estén definidos