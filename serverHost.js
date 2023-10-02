const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const cookieParser = require('cookie-parser');
const nodemailer = require('nodemailer');
const crypto = require('crypto'); // Import crypto for generating a random ID

const app = express();
app.use(cookieParser());
app.use(bodyParser.json());
// Define the directory where your static HTML files are located
const staticDir = path.join(__dirname, 'public');

// Serve static files from the "public" directory
app.use(express.static(staticDir));

// Define a route to serve your HTML page
app.get('/', (req, res) => {
  res.sendFile(path.join(staticDir, 'index.html'));
});
app.get('/api/ticket/:ticketId', (req, res) => {
  // Read the JSON data from the 'tickets.json' file
  const rawData = fs.readFileSync('tickets.json');
  
  // Parse the JSON data into an array
  const tickets = JSON.parse(rawData);

  const ticketId = req.params.ticketId;
  const ticket = tickets.find((ticket) => ticket.id === ticketId);

  if (!ticket) {
    console.log('Ticket not found');
    return res.status(404).json({ error: 'Ticket not found' });
  }

  const { id, date, email, livestreamurl } = ticket;
  const ticketProfile = { id, date, email, livestreamurl };

  res.json(ticketProfile);
});


app.post('/api/registershow', (req, res) => {
  const newRegister = req.body;

  // Read the upcoming missions from the JSON file
  const upcomingRegister = JSON.parse(fs.readFileSync('tickets.json'));

  // Generate a unique 15-character ID
  const uniqueId = generateUniqueId(15);

  // Assign the unique ID to the new mission
  newRegister.id = uniqueId;

  // Check if the date matches a specific date to set the livestream URL
  if (newRegister.date === '1') {
    newRegister.livestreamurl = 'https://youtube.com'; // Set the specific URL
  }

  // Add the new mission to the upcoming missions array
  upcomingRegister.push(newRegister);

  // Save the updated upcoming missions array to the JSON file
  fs.writeFileSync('tickets.json', JSON.stringify(upcomingRegister, null, 2));

  // Send an email with all the information to the provided email address
  sendEmail(newRegister)
    .then(() => {
      res.json({ message: 'Registration added successfully', register: newRegister });
    })
    .catch((error) => {
      console.error('Error sending email:', error);
      res.status(500).json({ error: 'An error occurred while sending the email' });
    });
});

// Function to generate a unique ID
function generateUniqueId(length) {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let id = '';
  for (let i = 0; i < length; i++) {
    const randomIndex = crypto.randomInt(0, charset.length);
    id += charset.charAt(randomIndex);
  }
  return id;
}

// Function to send an email
// Function to send an email
async function sendEmail(registerData) {
  const transporter = nodemailer.createTransport({
    service: 'your-email-service-provider', // E.g., 'Gmail', 'Outlook'
    auth: {
      user: 'your-email@gmail.com', // Your email address
      pass: 'your-email-password', // Your email password or an application-specific password
    },
  });

  // Define the HTML content of the email
  const htmlContent = `
    <html>
      <head>
        <style>
          /* Add any CSS styling you want for your email here */
        </style>
      </head>
      <body>
        <p>Thank you for registering MASTERMINDS. Your unique access ID is: ${registerData.id}.</p>
        <p>Your selected date is: ${registerData.date}</p> <!-- Include the selected date here -->
        <p>This can be used on the MASTERMINDS digital ticket page, <a href="https://online.mastermindsshow.com">online.mastermindsshow.com</a>.</p>
        
        <!-- Check if there is a livestream URL and include it in the email -->
        ${registerData.livestreamurl ? `<p>Join the livestream <a href="${registerData.livestreamurl}">here</a>.</p>` : ''}
      </body>
    </html>
  `;

  const mailOptions = {
    from: 'your-email@gmail.com', // Sender's email address
    to: registerData.email, // Receiver's email address from the registration data
    subject: 'Registration Confirmation',
    // text: `Thank you for registering MASTERMINDS. Your unique access ID is: ${registerData.id}. This can be used on the MASTERMINDS digital ticket page, online.mastermindsshow.com.`,
    html: htmlContent, // Use the HTML content defined above
  };

  await transporter.sendMail(mailOptions);
}


// Start the server
const PORT = 8000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
