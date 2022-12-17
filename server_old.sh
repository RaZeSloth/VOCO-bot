GREEN='\033[0;32m'
NC='\033[0m' # No Color

echo -e "${GREEN}Updating git repo..."
git reset --hard > /dev/null 
git pull > /dev/null
echo -e "Changing puppeteer version..."
yarn remove puppeteer > /dev/null
yarn install --production --update-checksums > /dev/null
yarn add puppeteer-core@v1.11.0 > /dev/null
echo -e "Changing puppeteer executable path"
# Use sed to replace the executablePath in the puppeteer-core package
sed -i "s/puppeteer/puppeteer-core/g" src/util/tunniplaan.ts && sed -i "s_({ headless: true });_({ headless: true, executablePath: '/usr/bin/chromium-browser' });_g" src/util/tunniplaan.ts
sed -i "s/puppeteer/puppeteer-core/g" src/util/functions.ts && sed -i "s_({ headless: true, defaultViewport: { width: 1920, height: 1080 } });_({ headless: true, executablePath: '/usr/bin/chromium-browser', defaultViewport: { width: 1920, height: 1080 } });_g" src/util/functions.ts
echo -e "Done! Restarting node process. ${NC}"
pm2 restart 'voco-bot'
