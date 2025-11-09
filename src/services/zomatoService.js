const csv = require('csvtojson');

async function loadZomatoData(filePath) {
  try {
    const jsonArray = await csv().fromFile(filePath);

    // console.log('✅ Sample row from CSV:', jsonArray[0]);

    const headers = Object.keys(jsonArray[0]);
    console.log('✅ CSV Headers:', headers);
    
    return jsonArray;
  } catch (error) {
    console.error('❌ Failed to load CSV:', error);
    throw error;
  }
}

module.exports = loadZomatoData;
