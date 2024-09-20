import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { DetectDocumentTextCommand, TextractClient } from "@aws-sdk/client-textract";

const s3client = new S3Client();

export const handler = async (event, context) => {
  
  const textractClient = new TextractClient();
  const fileName = event.fileName;
  const fileBuffer = event.fileBuffer;
  let fileUrl = '';
  const buffer = Buffer.from(fileBuffer, "base64");
  let finalResponse = {};

  // upload files to s3 bucket
  const command = new PutObjectCommand({
    Bucket: process.env.BUCKET_NAME,
    Key: fileName,
    Body: buffer,
  });

  try {
    
    const response = await s3client.send(command);
    
    if (response.$metadata.httpStatusCode == 200) {
      fileUrl = `https://${process.env.BUCKET_NAME}.s3.amazonaws.com/${fileName}`;

      // reads document using textract
      const params = new DetectDocumentTextCommand({
        Document: {
          S3Object: {
            Bucket: process.env.BUCKET_NAME,
            Name: fileName,
          },
        },
        FeatureTypes: ["TABLES", "FORMS"],
      });

      const { Blocks } = await textractClient.send(params);

      // // // For the purpose of this example, we are only interested in words.
      // const extractedWords = Blocks.filter((b) => b.BlockType === "WORD").map(
      //   (b) => b.Text,
      // );

      // return extractedWords.join(" ");
      const blocks = Blocks;

      // Extract text from LINE blocks
      const textLines = blocks
        .filter((block) => block.BlockType === "LINE")
        .map((block) => block.Text);

      // Join lines into a single string
      const fullText = textLines.join(" ").trim();

      // Print the extracted text for inspection
      console.log("Full extracted text:", fullText);

      // Extract relevant information
      const addressPattern = /Address\s*([^\n]*)/i;
      const datePattern = /Date\s*([^\n]*)/i;
      const amountPattern = /Amount\s*\(.*?\)\s*:\s*([^\n]*)/i;
      const accountNamePattern = /Account Name\s*([^\n]*)/i;
      const accountNumberPattern = /Account Number\s*([^\n]*)/i;
      const cardNumberPattern = /Card number\s*([^\n]*)/i;
      const paymentModePattern = /Payment mode\s*\(([^)]+)\)/i;
      const numberOfDaysPattern =
        /Number of days to be spent outside Malawi \(travel\)\s*([^\n]*)/i;
      const countryPattern = /Country to be visited\s*([^\n]*)/i;
      const passportPattern = /Valid Passport Number\s*([^\n]*)/i;
      const evidencePattern =
        /Evidence of travel or staying abroad\s*([^\n]*)/i;
      const phoneNumberPattern = /Phone Number \(s\)\s*([^\n]*)/i;
      const emailPattern = /Email Address\s*([^\n]*)/i;

      const extract = (pattern) => {
        const match = fullText.match(pattern);
        return match ? match[1].trim() : "Not found";
      };

      const extractedData = {
        address: extract(addressPattern).slice(0, 30),
        date: extract(datePattern).slice(0, 10),
        amount: extract(amountPattern).slice(0, 8),
        accountName: extract(accountNamePattern).slice(0, 13),
        accountNumber: extract(accountNumberPattern).slice(0, 13),
        cardNumber: extract(cardNumberPattern).slice(0, 22),
        paymentMode: extract(paymentModePattern).slice(0, 25),
        fileUrl: fileUrl,
        // numberOfDays: extract(numberOfDaysPattern).slice(0, 25),
        // country: extract(countryPattern).slice(0, 15),
        // passportNumber: extract(passportPattern).slice(0, 22),
        // evidence: extract(evidencePattern).slice(0, 25),
        // phoneNumber: extract(phoneNumberPattern).slice(0, 25),
        // email: extract(emailPattern).slice(0, 25),
      };
      
      finalResponse = {
        "statusCode": 200,
        "message": extractedData
      }
      
      return finalResponse;
      
    } else {
      
      console.log(response);
      finalResponse = {
        "statusCode": 500,
        "message": response
      }
    }
  } catch (error) {
    console.log("#####################################")
    console.log(error);
    finalResponse = {
        "statusCode": 500,
        "message": "Error" + error
      }
  }

  return finalResponse;
};
