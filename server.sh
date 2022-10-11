git reset --hard
git pull
yarn remove puppeteer
yarn install --production
yarn add puppeteer-core@v1.11.0
# Use sed to replace the executablePath in the puppeteer-core package
sed -i "s/puppeteer/puppeteer-core/g" src/util/tunniplaan.ts && sed -i "s_({ headless: true });_({ headless: true, executablePath: '/usr/bin/chromium-browser' });_g" src/util/tunniplaan.ts
pm2 restart 'voco-bot'