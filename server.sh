GREEN='\033[0;32m'
NC='\033[0m' # No Color

echo -e "${GREEN}Updating git repo..."
git reset --hard > /dev/null 
git pull > /dev/null
echo -e "Updating dependencies..."
yarn install --production --update-checksums > /dev/null
echo -e "Done! Restarting node process. ${NC}"
pm2 restart 'voco-bot'
