console.log('Node.js is working!');
console.log('Current directory:', process.cwd());
try {
  require('express');
  console.log('Express is installed');
} catch (e) {
  console.log('Express is NOT installed');}

try {
  require('razorpay');
  console.log('Razorpay is installed');
} catch (e) {
  console.log('Razorpay is NOT installed');
}
