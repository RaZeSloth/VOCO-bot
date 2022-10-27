git reset --hard
git pull
yarn remove puppeteer
yarn install --production --update-checksums
yarn add puppeteer-core@v1.11.0
# Use sed to replace the executablePath in the puppeteer-core package
sed -i "s/puppeteer/puppeteer-core/g" src/util/tunniplaan.ts && sed -i "s_({ headless: true });_({ headless: true, executablePath: '/usr/bin/chromium-browser' });_g" src/util/tunniplaan.ts
sed -i "s/puppeteer/puppeteer-core/g" src/util/functions.ts && sed -i "s_({ headless: true, defaultViewport: { width: 1920, height: 1080 } });_({ headless: true, executablePath: '/usr/bin/chromium-browser', defaultViewport: { width: 1920, height: 1080 } });_g" src/util/functions.ts

pm2 restart 'voco-bot'
