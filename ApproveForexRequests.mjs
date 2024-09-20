import { UpdateItemCommand, DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { ScanCommand, GetCommand  } from "@aws-sdk/lib-dynamodb";

// Initialize the DynamoDB client
const client = new DynamoDBClient();

export const handler = async (event, context) => {
    const tableName = process.env.applicationTableName;
    let finalResponse = ""
    
    // Extract values from the event object
    const application_id = event.application_id;  // Assuming userId is passed in event
    const newStatus = event.status;
    let updateExpression = ""
    let expressionAttributeNames = {}
    let expressionAttributeValues = {}

    
    // Define the primary key of the item you  to be updates
    const key = {
        application_id: { S: application_id }
    };
    
    if ('approved_by' in event & 'approved_date' in event){
        const newApprovedDate = event.approved_date; 
        const newApprovedBy = event.approved_by;
        
         // Update expression to update 'name', 'email', and 'age'
        updateExpression = 'SET #status = :newStatus, #approved_date = :newApprovedDate, #approved_by = :newApprovedBy';
    
        // Attribute names (to avoid conflicts with reserved keywords in DynamoDB)
        expressionAttributeNames = {
            '#status': 'status',
            '#approved_date': 'approved_date',
            '#approved_by': 'approved_by',
        };
    
        // Attribute values to update with
        expressionAttributeValues = {
           ':newStatus': { S: newStatus },
            ':newApprovedDate': { S: newApprovedDate },
            ':newApprovedBy': { S: newApprovedBy },
        };
    }
    
     else if('rejected_date' in event & 'rejected_by' in event){
        const newRejectedDate = event.rejected_date; 
        const newRejectedBy = event.rejected_by;
        
        // Update expression to update 'name', 'email', and 'age'
        updateExpression = 'SET #status = :newStatus, #rejected_date = :newRejectedDate, #rejected_by = :newRejectedBy';
    
        // Attribute names (to avoid conflicts with reserved keywords in DynamoDB)
        expressionAttributeNames = {
            '#status': 'status',
            '#rejected_date': 'rejected_date',
            '#rejected_by': 'rejected_by',
         };
    
        // Attribute values to update with
        expressionAttributeValues = {
           ':newStatus': { S: newStatus },
            ':newRejectedDate': { S: newRejectedDate },
            ':newRejectedBy': { S: newRejectedBy },
        };
        
    }


    const params = {
        TableName: tableName,
        Key: key,
        UpdateExpression: updateExpression,
        ExpressionAttributeNames: expressionAttributeNames,
        ExpressionAttributeValues: expressionAttributeValues,
        ReturnValues: 'UPDATED_NEW'
    };

    try {
        // Perform the update operation
        const data = await client.send(new UpdateItemCommand(params));
        console.log('Update successful:', data);
        finalResponse =  {
            "statusCode": 200,
            "message": JSON.stringify(data.Attributes) // Return the updated attributes
        };
    } catch (err) {
        finalResponse = {
            "statusCode": 500,
             "message": "Failed to Update Item Error: " + err
        };
    }
    return finalResponse;
};
