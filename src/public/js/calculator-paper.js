document.addEventListener("DOMContentLoaded", function () {
  const input1 = document.getElementById('input1'); // Pliego ancho
  const input2 = document.getElementById('input2'); // Pliego alto
  const input3 = document.getElementById('input3'); // Corte ancho
  const input4 = document.getElementById('input4'); // Corte alto
  const input5 = document.getElementById('input5'); // Cantidad unidades
  const result = document.getElementById('result');
  const resultC = document.getElementById('resultC');
  const porO = document.getElementById('porO');
  const porL = document.getElementById('porL');
  const width = document.getElementById('width');
  const height = document.getElementById('height');

  const margenIzq = document.getElementById('margenIzquierdo');
  const margenSup = document.getElementById('margenSuperior');
  const margenDer = document.getElementById('margenDerecho');
  const margenInf = document.getElementById('margenInferior');

  const calculateBtn1 = document.getElementById('calculate-btn1');
  const calculateBtn2 = document.getElementById('calculate-btn2');

  const escala = 2.5;

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

  function fresultado(L, H, a, b) {
    const margenX = Number(margenIzq.value) || 0;
    const margenY = Number(margenSup.value) || 0;
    const margenD = Number(margenDer.value) || 0;
    const margenI = Number(margenInf.value) || 0;

    const anchoDisponible = L - margenX - margenD;
    const altoDisponible = H - margenY - margenI;

    const cL = Math.floor(anchoDisponible / a);
    const cH = Math.floor(altoDisponible / b);
    const resultado = cL * cH;

    resultC.value = resultado;
    result.value = resultado > 0 ? Math.ceil(input5.value / resultado) : 0;

    fporcentajes(resultado, a, b, L, H);
  }

  function fporcentajes(res, a, b, L, H) {
    const areaI = a * b * res;
    const areaP = L * H;

    porO.value = Number((areaI / areaP * 100).toFixed(2));
    porL.value = Number((100 - Number(porO.value)).toFixed(2));
  }

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
    ctx.strokeRect(0, 0, rectWidth, rectHeight);
  }

  function drawRectV(L, H, a, b) {
    const canvas = document.getElementById("myCanvas");
    const ctx = canvas.getContext("2d");

    const margenX = Number(margenIzq.value) || 0;
    const margenY = Number(margenSup.value) || 0;
    const margenD = Number(margenDer.value) || 0;
    const margenI = Number(margenInf.value) || 0;

    const anchoDisponible = L - margenX - margenD;
    const altoDisponible = H - margenY - margenI;

    const cL = Math.floor(anchoDisponible / a);
    const cH = Math.floor(altoDisponible / b);

    let contL = 0;
    let contH = 0;
    let x = margenX;
    let y = margenY;

    ctx.fillStyle = "red";
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 1;

    width.value = cL;
    height.value = cH;

    while (contH < cH) {
      contL = 0;
      x = margenX;
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

  calculateBtn1.addEventListener('click', calcular1);
  calculateBtn2.addEventListener('click', calcular2);
});
