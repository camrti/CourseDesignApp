const fs = require('fs');
const path = require('path');
const Microcontent = require('./models/microcontent');

async function seedMicrocontents() {
  try {
    // Check if microcontents already exist
    const count = await Microcontent.countDocuments();

    if (count > 0) {
      console.log(`Microcontent database already seeded with ${count} items. Skipping seed.`);
      return;
    }

    console.log('No microcontents found in database. Starting seed process...');

    // Read the JSON file
    const jsonPath = path.join(__dirname, '..', '..', 'annotation-scripts', 'output', 'microcontents-real.json');

    if (!fs.existsSync(jsonPath)) {
      console.warn(`Warning: microcontents-real.json not found at ${jsonPath}`);
      console.warn('Skipping microcontent seeding.');
      return;
    }

    const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

    if (!data.microcontents || !Array.isArray(data.microcontents)) {
      console.error('Invalid JSON structure: expected { microcontents: [...] }');
      return;
    }

    console.log(`Found ${data.microcontents.length} microcontents to seed.`);

    // Insert all microcontents
    const result = await Microcontent.insertMany(data.microcontents, { ordered: false });

    console.log(`✅ Successfully seeded ${result.length} microcontents into the database!`);

    // Log some stats
    const stats = {
      video: await Microcontent.countDocuments({ contentType: 'video' }),
      audio: await Microcontent.countDocuments({ contentType: 'audio' }),
      pdf: await Microcontent.countDocuments({ contentType: 'pdf' }),
      infographic: await Microcontent.countDocuments({ contentType: 'infographic' }),
      total: await Microcontent.countDocuments()
    };

    console.log('Microcontent statistics:');
    console.log(`  - Videos: ${stats.video}`);
    console.log(`  - Audio: ${stats.audio}`);
    console.log(`  - PDFs: ${stats.pdf}`);
    console.log(`  - Infographics: ${stats.infographic}`);
    console.log(`  - Total: ${stats.total}`);

  } catch (error) {
    if (error.code === 11000) {
      // Duplicate key error - some microcontents already exist
      console.warn('Some microcontents already exist (duplicate identifiers). Seeding partially completed.');
    } else {
      console.error('Error seeding microcontents:', error.message);
      throw error;
    }
  }
}

module.exports = seedMicrocontents;
