const express = require("express");
const morgan = require("morgan");
const cors = require("cors");
const bodyParser = require("body-parser");
const puppeteer = require("puppeteer");
const app = express(); // Initializing Express

// aplico configurações para dentro do servidor express, adicionando middlewares (body-parser, morgan, cors)
app.use(morgan("dev"));
app.use(express.json({ limit: "8000mb" }));
app.use(bodyParser.urlencoded({ extended: false, limit: "8000mb" }));
app.use(bodyParser.json());
app.use(cors());

// criação de rota que será acessada utilizando o método HTTP GET/
// http://localhost:9000/
app.get("/wws", async (req, res) => {
  const cpf = req.query.cpf;
  const browser = await getBrowser();
  const object = await getInformationWWSByCPF(browser, cpf);
  await browser.close();
  return res.json(object);
});

app.get("/transmann", async (req, res) => {
  const cpf = req.query.cpf;
  const browser = await getBrowser();
  const object = await getInformationTransmannByCPF(browser, cpf);
  await browser.close();
  return res.json(object);
});


app.get("/todo", async (req, res) => {
  const cpf = req.query.cpf;
  const browser = await getBrowser();
  const wws = await getInformationWWSByCPF(browser, cpf);
  const transmann = await getInformationTransmannByCPF(browser, cpf);
  await browser.close();
  return res.json({wws, transmann});
});


// o servidor irá rodar dentro da porta 9000
app.listen(9000, () => console.log("Express started at http://localhost:9000"));

async function getBrowser() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  return browser;
}

async function getInformationWWSByCPF(browser, cpf) {
  const page = await browser.newPage();
  await page.goto("https://ssw.inf.br/2/rastreamento_pf");
  await page.type('input[name="cnpjdest"]', cpf);
  await page.click('a[id="btn_rastrear"]');
  await delay(1000);
  const elements = await page.$$(".geral");

  const snap = await elements[2]
    .screenshot({ encoding: "base64" })
    .then(function (data) {
      let base64Encode = `data:image/png;base64,${data}`;
      return base64Encode;
    });

  return snap;
}

async function getInformationTransmannByCPF(browser, cpf) {
  const page = await browser.newPage();
  await page.goto("https://www.transmann.com.br/AutoTracking?track=" + cpf);
  await delay(5000);
  const elements = await page.$$(".contentbody");
  const secondElement = elements[1];

  const snap = await secondElement
    .screenshot({ encoding: "base64" })
    .then(function (data) {
      let base64Encode = `data:image/png;base64,${data}`;
      return base64Encode;
    });

  return snap;
}

// (async () => {
//   const browser = await getBrowser();
//   const a = await getInformationWWSByCPF(browser, "49752120563");
//   const b = await getInformationTransmannByCPF(browser, "49752120563");

//   console.log(a);
//   console.log(b);
//   await browser.close();
// })();

function delay(time) {
  return new Promise((resolve) => setTimeout(resolve, time));
}
