const electricityService = require('./services/electricity/electricityService');

async function generateNDData() {
  try {
    console.log('Starting ND data generation...');
    
    const result = await electricityService.getNationalDemandData();
    
    console.log('ND data generation completed!');
    console.log(`Total days processed: ${result.count}`);
    console.log(`File saved to: ${result.savedToFile}`);
    
    // Show first few records as preview
    console.log('\nFirst 5 records:');
    result.data.slice(0, 5).forEach(record => {
      console.log(`${record.date}: ${record.averageND} (${record.count} periods)`);
    });
    
  } catch (error) {
    console.error('Error generating ND data:', error);
  }
}

// Run the function
generateNDData(); 