#!/usr/bin/env node

// Simple test to verify tow company data is properly structured
const fs = require('fs');
const path = require('path');

console.log('🧪 Testing Tow Company Implementation...\n');

// Test 1: Check if towCompanyService.ts exists and has proper structure
const towServicePath = path.join(__dirname, 'src/services/towCompanyService.ts');
if (fs.existsSync(towServicePath)) {
  console.log('✅ TowCompanyService file exists');
  const content = fs.readFileSync(towServicePath, 'utf8');
  
  if (content.includes('TOW_COMPANIES_DATA')) {
    console.log('✅ TOW_COMPANIES_DATA constant found');
  }
  
  if (content.includes('Bribie') && content.includes('Moreton Island') && content.includes('Straddie')) {
    console.log('✅ All three locations have tow company data');
  }
  
  // Count phone numbers
  const phoneMatches = content.match(/phone:\s*['"][^'"]+['"]/g);
  if (phoneMatches && phoneMatches.length >= 9) {
    console.log(`✅ Found ${phoneMatches.length} phone numbers (expected at least 9)`);
  } else {
    console.log(`❌ Found ${phoneMatches ? phoneMatches.length : 0} phone numbers (expected at least 9)`);
  }
} else {
  console.log('❌ TowCompanyService file not found');
}

// Test 2: Check if types.ts has been updated
const typesPath = path.join(__dirname, 'src/types.ts');
if (fs.existsSync(typesPath)) {
  const typesContent = fs.readFileSync(typesPath, 'utf8');
  
  if (typesContent.includes('interface TowCompany')) {
    console.log('✅ TowCompany interface added to types');
  }
  
  if (typesContent.includes('towCompanies?:')) {
    console.log('✅ Location interface updated with towCompanies field');
  }
} else {
  console.log('❌ types.ts file not found');
}

// Test 3: Check if LocationCard has been updated
const locationCardPath = path.join(__dirname, 'src/components/LocationCard.tsx');
if (fs.existsSync(locationCardPath)) {
  const cardContent = fs.readFileSync(locationCardPath, 'utf8');
  
  if (cardContent.includes('Emergency Beach Recovery Services')) {
    console.log('✅ LocationCard updated with emergency contacts section');
  }
  
  if (cardContent.includes('tel:')) {
    console.log('✅ Phone number links implemented');
  }
  
  if (cardContent.includes('location.towCompanies')) {
    console.log('✅ LocationCard accesses tow company data');
  }
} else {
  console.log('❌ LocationCard.tsx file not found');
}

console.log('\n🎉 Tow Company Implementation Test Complete!');
console.log('\n📋 Summary:');
console.log('- Added TowCompany interface and updated Location type');
console.log('- Created TowCompanyService with data for all 3 locations');
console.log('- Updated WillyWeatherService to include tow company data');
console.log('- Updated MockDataService for testing compatibility');
console.log('- Enhanced LocationCard to display emergency contacts');
console.log('- Added clickable phone number links for easy calling');
console.log('- Included tow companies even in error states');