const puppeteer = require("puppeteer");
const fs = require("fs");

async function saveElementsToFile(url) {
    const browser = await puppeteer.launch({
        headless: false, // Установите true, если не хотите видеть браузер
        protocolTimeout: 100000, // Увеличиваем время ожидания
        args: ["--no-sandbox", "--disable-setuid-sandbox"] // Добавляем флаги
    });
    const page = await browser.newPage();

    await page.setViewport({ width: 700, height: 15000 });

    await page.setUserAgent(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.82 Safari/537.36"
    );
    await page.setExtraHTTPHeaders({
        "Accept-Language": "en-US,en;q=0.9"
    });

    console.log(`Navigating to ${url}...`);
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });

    await page.waitForSelector(".virtual-list--FMDYy._vertical--GsTT6", { timeout: 100000 });

    await new Promise((res) => setTimeout(res, 3000));

    const elementsData = await page.evaluate(() => {
        const elements = document.querySelectorAll(".virtual-list--FMDYy._vertical--GsTT6");
        let results = [];
        const names = [];

        // Проходим по всем найденным элементам
        elements.forEach((element) => {
            const height = parseFloat(window.getComputedStyle(element).height);
            if (height > 5000) {
                // Ищем все дочерние элементы с атрибутом data-testid, начинающимся с sportBaseEvent
                const childElements = element.querySelectorAll('[data-testid^="sportBaseEvent"]');

                // Проверяем наличие указанного элемента внутри дочерних элементов
                Array.from(childElements).forEach((child, i) => {
                    const allFrozenRatio = child.querySelectorAll(".factor-value--zrkpK._disable--MkuDy .value--OUKql");
                    const frozenRatio = allFrozenRatio[1];
                    if (frozenRatio && Number(frozenRatio.innerText) && allFrozenRatio.length === 1) {
                        function addRatio() {
                            if (child) {
                                const name = child.querySelector('[data-testid="event"]')?.innerText;
                                results.push(child.outerHTML);
                                names.push({ name, k: frozenRatio.innerText });
                            }
                        }

                        addRatio();
                    }
                });
            }
        });

        return { results, names };
    });

    console.log(elementsData.names);
    await browser.close();

    if (elementsData.results.length > 0) {
        const combinedHTML = elementsData.results.join("\n"); // Объединяем HTML всех подходящих элементов
        fs.writeFileSync("sportBaseEvent_elements.html", combinedHTML, "utf-8");
        console.log(
            `Found ${elementsData.results.length} elements with data-testid starting with "sportBaseEvent". Saved to sportBaseEvent_elements.html`
        );
    } else {
        console.log('No elements found with data-testid starting with "sportBaseEvent".');
        saveElementsToFile(url).catch((err) => {
            console.log(err);
            saveElementsToFile(url);
        });
    }
}

// Замените 'https://fon.bet/sports/hockey' на нужный URL

saveElementsToFile("https://fon.bet/sports/hockey").catch((err) => {
    console.log(err);
    saveElementsToFile("https://fon.bet/sports/hockey");
});
