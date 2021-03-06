// this is simply to send emails via AWS SES
import AWS  from 'aws-sdk';
import mailcomposer from 'mailcomposer';
import { logInfo, logError } from '../common/logger';

let thisSES = null;
let sender = null;

export const initialiseSES = async (lambdaRegion, sendFrom=null) => {
  thisSES = new AWS.SES({apiVersion: '2010-12-01', region: lambdaRegion});

  if (sendFrom) {
    sender = sendFrom;
  } else {
    const SEND_FROM = process.env.EMAIL_SENDER
    sender = SEND_FROM;
  }
};

export const sendByEmail = async (to, subject, htmlMessage, plainMessage) =>  {
    try {
      // sending mail is restricted policy attached to the account
      const goodParam = {
        Destination: { /* required */
          // CcAddresses: [
          //   'EMAIL_ADDRESS',
          //   /* more items */
          // ],
          ToAddresses: to.split(';')
        },
        Message: { /* required */
          Body: { /* required */
            Html: {
            Charset: "UTF-8",
            Data: htmlMessage
            },
            Text: {
            Charset: "UTF-8",
            Data: plainMessage
            }
          },
          Subject: {
            Charset: 'UTF-8',
            Data: subject
          }
          },
        Source: sender, /* required */
        ReplyToAddresses: [
          sender,
          /* more items */
        ],
      };

      await thisSES.sendEmail(goodParam).promise();
      logInfo(`sendByEmail: sent email to ${to}`);
    } catch (err) {
      logError(err);
    }
};

export const sendByEmailWithAttachment = (to, subject, attachments) => {
  const mail = mailcomposer({
    from: sender,
    replyTo: sender,
    to,
    subject,
    text: 'Attached are establishments and workers daily snapshot reports.',
    attachments,
  });

  return new Promise((resolve, reject) => {
    mail.build((err, message) => {
      if (err) {
        reject(`Error composing raw email: ${err}`);
      }
      const sendRawEmailPromise = thisSES.sendRawEmail({RawMessage: {Data: message}}).promise();

      sendRawEmailPromise
        .then(data => {
          resolve(`sendByEmailWithAttachment: sent email to ${to}`);
        })
        .catch(err => {
          reject(`Error send raw email: ${err}`);
        });
      
    });
  });
};