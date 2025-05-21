// Envuelve todo el código en un evento que espera que el DOM esté completamente cargado
document.addEventListener("DOMContentLoaded", function() {
  // Obtener referencias a los elementos de entrada y salida de la calculadora
  const input1 = document.getElementById('input1');
  const input2 = document.getElementById('input2');
  const input3 = document.getElementById('input3');
  const input4 = document.getElementById('input4');
  const input5 = document.getElementById('input5');
  const result = document.getElementById('result');
  const resultC = document.getElementById('resultC');
  const porO = document.getElementById('porO');
  const porL = document.getElementById('porL');
  const inputCli = document.getElementById('inputNom');
  const width = document.getElementById('width');
  const height = document.getElementById('height');

  // Obtener referencias a los botones de "Calcular"
  const calculateBtn1 = document.getElementById('calculate-btn1');
  const calculateBtn2 = document.getElementById('calculate-btn2');

  const escala = 2.5;

  // Definir funciones para cada botón de "Calcular"
  // Horizontal
  function calcular1() {
      const a = Number(input3.value);
      const b = Number(input4.value);
      let L, H;

      if (Number(input1.value) >= Number(input2.value)) {
          L = Number(input1.value);
          H = Number(input2.value);
      } else {
          L = Number(input2.value);
          H = Number(input1.value);
      }

      fresultado(L, H, a, b);
      drawRectU(L, H);
      drawRectV(L, H, a, b);
  }

  // Vertical
  function calcular2() {
      const a = Number(input3.value);
      const b = Number(input4.value);
      let L, H;

      if (Number(input1.value) >= Number(input2.value)) {
          L = Number(input2.value);
          H = Number(input1.value);
      } else {
          L = Number(input1.value);
          H = Number(input2.value);
      }

      fresultado(L, H, a, b);
      drawRectU(L, H);
      drawRectV(L, H, a, b);
  }

  // Función para calcular resultados
  function fresultado(L, H, a, b) {
      const cL = Math.floor(L / a);
      const cH = Math.floor(H / b);
      const resultado = cL * cH;

      // Cantidad por pliego
      resultC.value = resultado;
      // Cantidad necesaria de pliegos
      result.value = Math.floor(input5.value / resultado) + 1;
      
      // Llamar función que calcula porcentajes
      fporcentajes(resultado, a, b, L, H);
  }

  // Función para calcular porcentajes ocupados y libres
  function fporcentajes(res, a, b, L, H) {
      const areaI = a * b * res;
      const areaP = L * H;

      porO.value = Number((areaI / areaP * 100).toFixed(2));
      porL.value = Number((100 - Number(porO.value)).toFixed(2));
  }

  // Dibujar rectángulo según medidas dadas desde index.html
  function drawRectU(L, H) {
      const canvas = document.getElementById("myCanvas");
      const ctx = canvas.getContext("2d");
      const rectWidth = L * escala;
      const rectHeight = H * escala;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "white";
      ctx.strokeStyle = 'black';
      ctx.lineWidth = 5;
      ctx.fillRect(0, 0, rectWidth, rectHeight);
  }

  // Dibujar unidades dentro del pliego
  function drawRectV(L, H, a, b) {
      const canvas = document.getElementById("myCanvas");
      const ctx = canvas.getContext("2d");
      let cL = Math.floor(L / a);
      let cH = Math.floor(H / b);
      let contL = 0;
      let contH = 0;
      let x = 0;
      let y = 0;

      ctx.fillStyle = "red";
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 1;

      width.value = cL;
      height.value = cH;

      while (contH < cH) {
          contL = 0;
          x = 0;

          while (contL < cL) {
              ctx.fillRect(x * escala, y * escala, a * escala, b * escala);
              ctx.strokeRect(x * escala, y * escala, a * escala, b * escala);
              contL++;
              x += a;
          }
          
          contH++;
          y += b;
      }
  }

  // Agregar los eventos de clic a los botones
  calculateBtn1.addEventListener('click', calcular1);
  calculateBtn2.addEventListener('click', calcular2);
});
