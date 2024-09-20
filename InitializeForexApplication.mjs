import { PutItemCommand, DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { ScanCommand, GetCommand  } from "@aws-sdk/lib-dynamodb";

const dynamoClient = new DynamoDBClient({});

export const handler = async (event, context) => {
    let finalResponse = ""

    try {

        // FETCHING ALL CUSTOMER APPLICATION IN DYNAMO DB
        if (Object.keys(event).length == 0){
            const getALlAppsParams = new ScanCommand({
              TableName: process.env.applicationTableName,
            });
            const getALlAppsResponse = await dynamoClient.send(getALlAppsParams);
            if (getALlAppsResponse.$metadata.httpStatusCode == 200){
                    finalResponse = {
                    "statusCode": 200,
                    "message": getALlAppsResponse.Items
                }} else {
                    finalResponse = {
                    "statusCode": 500,
                    "message": "Applications fetching failed"
                }}
        } 
        
        // FETCHING CUSTOMER APPLICATION WITH APPLICATIO ID SECTION
        
        else if(Object.keys(event).length == 1 & Object.keys(event)[0] == 'application_id' ){
            
            const application_id = event.application_id;
  
              // initialize dynamo DB configs
              const fetchAppParams = new GetCommand({
                TableName: process.env.applicationTableName,
                Key: {
                  application_id: application_id,
                },
              });
            
              const fetchAppResponse = await dynamoClient.send(fetchAppParams);
              if ( fetchAppResponse.$metadata.httpStatusCode == 200 ){
                  
                //   FETCH APPLICATION'S DOCUMENT
                const fetchDocumentParams = new GetCommand({
                    TableName: process.env.documentTableName,
                    Key: { document_id: fetchAppResponse.Item.document_id },
                })
                const fetchDocumentResponse = await dynamoClient.send(fetchDocumentParams);
                
                //   FETCH APPLICATION'S CUSTOMER
                const fetchCustomerParams = new GetCommand({
                    TableName: process.env.customerTableName,
                    Key: { accountNumber: fetchAppResponse.Item.customer_id },
                })
                const fetchCustomerResponse = await dynamoClient.send(fetchCustomerParams);

                finalResponse = {
                "statusCode": 200,
                "message": {
                    "application_details":fetchAppResponse.Item,
                    "document_details": fetchDocumentResponse.Item,
                    "customer_details": fetchCustomerResponse.Item
                }
                }
              } else {
                  finalResponse = {
                  "statusCode": 500,
                  "message": "Customer application  fetching failed"
              }}
            
        }
        
        // FETCHING CUSTOMER DOCUMENT WITH DOCUMENT ID SECTION
        
        else if(Object.keys(event).length == 1 & Object.keys(event)[0] == 'document_id' ){
            
            const document_id = event.document_id;
  
              // initialize dynamo DB configs
              const fetchDocParams = new GetCommand({
                TableName: process.env.documentTableName,
                Key: {
                  document_id: document_id,
                },
              });
            
              const fetchDocResponse = await dynamoClient.send(fetchDocParams);
              if ( fetchDocResponse.$metadata.httpStatusCode == 200 ){
                finalResponse = {
                "statusCode": 200,
                "message": fetchDocResponse.Item
                }
              } else {
                  finalResponse = {
                  "statusCode": 500,
                  "message": "Customer document  fetching failed"
              }}
            
        }
        
        // LOADING CUSTOMER DOCUMENT IN DYNAMO DB
        
        else {
            // load documents 
            const insertDocParams = new PutItemCommand({
                TableName: process.env.documentTableName,
                Item: {
                    document_id: { S: event.document_id },
                    application_id: { S: event.application_id },
                    file_name: { S: event.file_name },
                    file_url: { S: event.file_url },
                    created_at: { S: event.created_at },
                    updated_at: { S: event.updated_at },
                    upload_date: { S: event.upload_date },
                    // file_buffer: { S: event.file_buffer },
                },
            });
    
            const addDocResponse = await dynamoClient.send(insertDocParams);
            console.log("$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$")
            console.log(addDocResponse)
            if (addDocResponse.$metadata.httpStatusCode == 200){
                // check if application is valid
                
                // LOADING CUSTOMER APPLICATION IN DYNAMO DB
                
                // load application in dynamo db
                const insertAppParams = new PutItemCommand({
                TableName: process.env.applicationTableName,
                Item: {
                    application_id: { S: event.application_id },
                    document_id: { S: event.document_id },
                    customer_id: { S: event.customer_id },
                    status: { S: event.status },
                    submission_date: { S: event.submission_date },
                    approved_date: { S: event.approved_date },
                    rejected_date: { S: event.rejected_date },
                    created_at: { S: event.created_at },
                    updated_at: { S: event.updated_at },
                    branch: { S: event.branch },
                }});
    
                const addAppResponse = await dynamoClient.send(insertAppParams);
                if (addAppResponse.$metadata.httpStatusCode == 200){
                    finalResponse = {
                    "statusCode": 200,
                    "message": "Application created succesfully"
                }} else {
                    finalResponse = {
                    "statusCode": 500,
                    "message": "Document creation failed"
                }}
        
            } else{
                finalResponse = {
                "statusCode": 500,
                "message": "Application creation failed"
            }}
        
        }
    }
    catch (error) {
        finalResponse = {
            "statusCode": 500,
            "message": "Error processing: " + error
        }
    }
    
    return finalResponse;
};
