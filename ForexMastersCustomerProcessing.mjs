import { PutItemCommand, DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { GetCommand } from "@aws-sdk/lib-dynamodb";


const dynamoClient = new DynamoDBClient({});

export const handler = async (event, context) => {
  
  let finalResponse = ""
  // get customer information based customer ID
  
  try {
  
      const accountNumber = event.accountNumber;
      
      // initialize dynamo DB configs
      const fetchCustomerParams = new GetCommand({
        TableName: process.env.customersTable,
        Key: {
          accountNumber : accountNumber,
        },
      });
      
      console.log("#################################")
      const fetchCustomerResponse = await dynamoClient.send(fetchCustomerParams);
      if (fetchCustomerResponse.$metadata.httpStatusCode == 200){
        finalResponse = {
        "statusCode": 200,
        "message": fetchCustomerResponse.Item
        }
      } else {
          finalResponse = {
          "statusCode": fetchCustomerResponse.$metadata.httpStatusCode,
          "message": "Error : " + fetchCustomerResponse.$metadata
      }}
      
   } catch (error) {
    finalResponse = {
        "statusCode": 500,
        "message": "Error: " + error
      }
  }
  return finalResponse;
};
