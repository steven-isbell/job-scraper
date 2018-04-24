const nodemailer = require("nodemailer");

const { email, pass } = require("./creds");
const mailList = require("./mailList");

const smtpTransport = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: email,
    pass
  }
});

const sendMail = () =>
  smtpTransport.sendMail(
    {
      from: `Joe Smith ${email}`,
      to: mailList,
      subject: "Job Details You Requested",
      text: `Here's the details you requested.`,
      attachments: [{ filename: "jobs.csv", path: `${__dirname}/../jobs.csv` }]
    },
    (error, response) => {
      if (error) {
        console.log(error);
      } else {
        console.log(response);
      }
      smtpTransport.close();
    }
  );

module.exports = sendMail;
