const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

const baseURL = 'https://en.wikipedia.org';
const imagesDir = path.join(__dirname, 'png-list-airline2');

// Create the list directory if it doesn't exist
if (!fs.existsSync(imagesDir)) {
  fs.mkdirSync(imagesDir);
}

async function fetchIATACodes() {
  try {
    const url = `${baseURL}/wiki/List_of_airline_codes`;
    const { data } = await axios.get(url);
    const $ = cheerio.load(data);

    const table = $('.wikitable.sortable');
    const iataLinks = [];

    table.find('tbody tr').each((index, element) => {
      const tds = $(element).find('td');
      const iataCode = $(tds[0]).text().trim();
      const icaoCode = $(tds[1]).text().trim();
      const airlineLink = $(tds[2]).find('a').attr('href');

      if (iataCode && icaoCode && airlineLink) {
        iataLinks.push({ iataCode, icaoCode, airlineLink });
      }
    });

    return iataLinks;
  } catch (error) {
    console.error(`Error fetching data: ${error.message}`);
  }
}

async function fetchAirlineImage(iataCode, icaoCode, airlineLink) {
  try {
    const url = `${baseURL}${airlineLink}`;
    const { data } = await axios.get(url);
    const $ = cheerio.load(data);

    const imageElement = $('.infobox-image img').first();
    const imageUrl = imageElement.attr('src');
    const airlineName = $('#firstHeading').text().trim().replace(/[^a-zA-Z0-9]/g, '').toUpperCase();

    if (imageUrl && airlineName) {
      const fullImageUrl = `https:${imageUrl}`;
      const imageResponse = await axios.get(fullImageUrl, { responseType: 'arraybuffer' });

      const imagePath = path.join(imagesDir, `${iataCode}.png`);
      fs.writeFileSync(imagePath, imageResponse.data);
      console.log(`Image for ${iataCode}-${icaoCode}-${airlineName} saved as ${iataCode}-${icaoCode}-${airlineName}.png`);
    }
  } catch (error) {
    console.error(`Error fetching image for ${iataCode}-${icaoCode}: ${error.message}`);
  }
}

async function main() {
  const iataLinks = await fetchIATACodes();

  for (const { iataCode, icaoCode, airlineLink } of iataLinks) {
    await fetchAirlineImage(iataCode, icaoCode, airlineLink);
  }
}

main();
