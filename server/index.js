const puppeteer = require("puppeteer");
const fs = require("fs");
const csv = require("fast-csv");
const nodemailer = require("nodemailer");

const sendMail = require(`${__dirname}/nodemailer`);
const { email, pass } = require(`${__dirname}/creds`);

const sleep = function(timeToWait) {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve(true);
    }, timeToWait);
  });
};

// READ DATA FROM CSV

const parseData = () => {
  let csvData = [];
  fs
    .createReadStream(`${__dirname}/../dataToScrape.csv`)
    .pipe(csv({ headers: true }))
    .on("data", data => {
      csvData.push(data);
    })
    .on("end", () => scrapeForJobs(csvData));
};

parseData();

// WRITE DATA TO CSV

const writeData = data => {
  let dataToWrite = data.map(val => [
    val.name,
    val.url,
    val.employer,
    val.title
  ]);
  dataToWrite.unshift(["Name", "Url", "Employer", "Title"]);
  const writeStream = fs.createWriteStream("./jobs.csv");
  csv.write(data, { headers: true }).pipe(writeStream);
  sendMail();
};

// SCRAPE FOR POSITION

const scrapeForJobs = async urlData => {
  const jobData = [];
  try {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();

    await page.goto("https://www.linkedin.com");
    await sleep(3000);
    await page.click("#login-email");
    await page.keyboard.type(email);
    await page.click("#login-password");
    await page.keyboard.type(pass);
    await page.click("#login-submit");
    await page.waitForNavigation();

    for (let i = 0; i < urlData.length; i++) {
      await page.goto(urlData[i].url);

      await sleep(2000);

      await page.screenshot({
        path: `${__dirname}/screenshots/example${i}.png`
      });

      const data = await page.evaluate(sel => {
        const currentJobBlockHolder =
          "#experience-section > ul.section-info > li.pv-profile-section__card-item > a > .pv-entity__summary-info" ||
          null;
        const currentJobBlock =
          document.querySelector(currentJobBlockHolder) || null;
        if (currentJobBlock) {
          const title = document.querySelector(`${currentJobBlockHolder} > h3`)
            .innerText;
          const employer = document.querySelector(
            `${currentJobBlockHolder} > h4 > .pv-entity__secondary-title`
          ).innerText;
          return {
            title,
            employer,
            name: sel.name,
            url: sel.url
          };
        } else
          return {
            title: null,
            employer: null,
            name: sel.name,
            url: sel.url
          };
      }, urlData[i]);

      jobData.push(data);
    }

    await browser.close();
    writeData(jobData);
  } catch (err) {
    console.log(err);
  }
};

// scrapeForJobs();
