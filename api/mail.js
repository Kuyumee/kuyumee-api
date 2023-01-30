const nodemailer = require("nodemailer");

const transport = nodemailer.createTransport({
  host: "smtp.example.com",
  port: 25,
});

const mailOptions = {
  from: "sender@example.com",
  to: "recipient@example.com",
  subject: "Test Email",
  text: "This is a test email sent without authentication.",
};

transport.sendMail(mailOptions, (error, info) => {
  if (error) {
    console.log(error);
  } else {
    console.log("Email sent: " + info.response);
  }
});
