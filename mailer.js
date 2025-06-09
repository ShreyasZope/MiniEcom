import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: "sszminiecomproject@gmail.com",
        pass: "oxtb snht bwri cnks", // Use App Password, not your Gmail password
    },
});

function sendEmail(mailId, subject, text) {
    const mailOptions = {
        from: "sszminiecomproject@gmail.com",
        to: mailId,
        subject: subject,
        text: text,
    };

    transporter.sendMail(mailOptions, (err, info) => {
        if (err) return console.error(err);
        console.log("Email sent: " + info.response);
    });
}

export { sendEmail };
