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

const port = process.env.PORT || 9000;

app.get("/todo", async (req, res) => {
  const cpf = req.query.cpf;
  const browser = await getBrowser();
  const wws = await getDataWWSByCPF(browser, cpf);
  const transmann = await getDataTransmannByCPF(browser, cpf);
  await browser.close();
  return res.json({wws, transmann});
});

// o servidor irá rodar dentro da porta 9000
app.listen(port, () => console.log('server runing on port:', port));

async function getBrowser() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  return browser;
}


function delay(time) {
  return new Promise((resolve) => setTimeout(resolve, time));
}


async function getDataWWSByCPF(browser, cpf){
  const page = await browser.newPage();
  const link = "https://ssw.inf.br/2/rastreamento_pf";
  await page.goto(link);
  await page.type('input[name="cnpjdest"]', cpf);
  await page.click('a[id="btn_rastrear"]');
  await delay(1000);
  const content = await page.content();
  const count = (content.match(/Nenhuma/g) || []).length;
  if(count != 0){
 return false;
  }else{

     // selecionar o elemento pai com a classe "trackviewitem nota"
     const elementoNota = await page.$('body > div:nth-child(5) > div.table > div:nth-child(3) > table:nth-child(4) > tbody > tr:nth-child(2) > td:nth-child(1)');
     const textoNota = await page.evaluate(el => el.textContent, elementoNota)
     
     const elementoUltimaAtualizacao = await page.$('body > div:nth-child(5) > div.table > div:nth-child(3) > table:nth-child(4) > tbody > tr:nth-child(2) > td:nth-child(2)');
     const textoUltimaAtualizacao = await page.evaluate(el => el.textContent, elementoUltimaAtualizacao)
     

     const elementoStatus = await page.$('body > div:nth-child(5) > div.table > div:nth-child(3) > table:nth-child(4) > tbody > tr:nth-child(2) > td:nth-child(3)');
     const textoStatus = await page.evaluate(el => el.textContent, elementoStatus)

    
     
     return [  ['Nota/Pedido', textoNota], ['Ultima Atualização', textoUltimaAtualizacao], ['Status', textoStatus], ['Saiba mais em', link]];
  
  }
  
}

async function getDataTransmannByCPF(browser, cpf){
  const page = await browser.newPage();
  const link = "https://www.transmann.com.br/AutoTracking?track=" + cpf;
  await page.goto(link);
  await delay(5000);
  const content = await page.content();

  if (content.includes('Sem resultados')) {
    return false;
  } else {
       // selecionar o elemento pai com a classe "trackviewitem nota"
        const elementoNota = await page.$('#tabs-1 > div.tracks-result > div.trackviewcontent > div > div.trackviewitem.nota > span');
        const textoNota = await page.evaluate(el => el.textContent, elementoNota)
        
        const elementoPrevisao = await page.$('#tabs-1 > div.tracks-result > div.trackviewcontent > div > div.trackviewitem.previsao > span');
        const textoPrevisao = await page.evaluate(el => el.textContent, elementoPrevisao)
        

        const elementoStatus = await page.$('#tabs-1 > div.tracks-result > div.trackviewcontent > div > div.trackviewitem.status > span');
        const textoStatus = await page.evaluate(el => el.textContent, elementoStatus)


        const elementoRementente = await page.$('#tabs-1 > div.tracks-result > div.trackviewcontent > div > div.trackviewitem.remetente');
        const textoRementente = await page.evaluate(el => el.textContent, elementoRementente)


        const elementoDestinatario = await page.$('#tabs-1 > div.tracks-result > div.trackviewcontent > div > div.trackviewitem.destinatario');
        const textoDestinatario = await page.evaluate(el => el.textContent, elementoDestinatario)

        
        return [['Remetente', textoRementente], ['Destinatário', textoDestinatario],  ['Nota/Pedido', textoNota], ['Previsão', textoPrevisao], ['Status', textoStatus], ['Saiba mais em', link]];
  }
}


// (async () => {
//   const browser = await getBrowser();
//   //49752120563
//   //07509531608
//   const a = await getDataWWSByCPF(browser, '07509531608');
//   const b = await getDataTransmannByCPF(browser, '49752120563')
//   console.log(a);
//   console.log(b);
//   await browser.close();
//   process.exit();
// })();