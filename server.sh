git reset --hard
git pull
yarn install --production
yarn remove puppeteer
yarn add puppeteer-core
# Use sed to replace the executablePath in the puppeteer-core package
sed -i "s/puppeteer/puppeteer-core/g" src/util/tunniplaan.ts && sed -i "s_({ headless: true });_({ headless: true, executablePath: '/usr/bin/chromium-browser' });_g" src/util/tunniplaan.ts
pm2 restart 'voco-bot'