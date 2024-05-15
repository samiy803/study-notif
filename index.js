import puppeteer from 'puppeteer';
import express from 'express';

const URL = "https://wlu-ls.sona-systems.com/";
const username = process.env.USERNAME;
const password = process.env.PASSWORD;
const token = process.env.TOKEN;

async function navigateToStudyPage(page) {
    await page.goto(URL);
    const usernameSelectorByName = "ctl00$ContentPlaceHolder1$userid"
    const passwordSelectorByName = "ctl00$ContentPlaceHolder1$pw"
    const loginButtonSelectorById = "ctl00$ContentPlaceHolder1$default_auth_button"


    await page.waitForSelector(`[name="${usernameSelectorByName}"]`);
    await page.waitForSelector(`[name="${passwordSelectorByName}"]`);
    await page.type(`[name="${usernameSelectorByName}"]`, username);
    await page.type(`[name="${passwordSelectorByName}"]`, password);

    await page.click(`[name="${loginButtonSelectorById}"]`);

    try {
        await page.waitForNetworkIdle({ idleTime: 250 });
    } catch (error) {
        console.log("Got timeout while waiting for network to be idle, proceeding anyway.")
    }

    await page.goto("https://wlu-ls.sona-systems.com/all_exp_participant.aspx")

    try {
        await page.waitForNetworkIdle({ idleTime: 250 });
    }
    catch (error) {
        console.log("Got timeout while waiting for network to be idle, proceeding anyway.")
    }
}

async function checkForStudies(page) {
    // Look for "No studies are available at this time."
    const noStudiesAvailable = await page.$eval("body", (body) => body.innerHTML.includes("No studies are available at this time."));
    return !noStudiesAvailable;
}

async function puppeteerCheck() {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();
    await page.waitForNetworkIdle
    page.setViewport({ width: 1920, height: 1080 });
    await navigateToStudyPage(page);
    const studiesAvailable = await checkForStudies(page);
    if (studiesAvailable) {
        console.log("Studies are available!");
    } else {
        console.log("No studies are available at this time.");
    }
    await browser.close();
    return studiesAvailable;
}


const app = express();
app.post('/', async (req, res) => {
    // check for auth token
    const h = req.headers;
    if (h.authorization !== `Bearer ${token}`) {
        res.status(401).send("Unauthorized");
        return;
    }
    const studiesAvailable = await puppeteerCheck();
    res.send(studiesAvailable ? "Studies are available!" : "No studies are available at this time.");
});

app.listen(3000, () => {
    console.log('Server is running on port 3000');
})