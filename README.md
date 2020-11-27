For integrating Salesforce© with follow the steps below – 
  1.	Create Amazon account and S3 bucket
  2.	Generate access key and secret key id
  3.	Configure the bucket policy
  4.	Create a new object in Salesforce© org
  5.	Create metadata for storing credentials
  6.	Add AWS SDK in static resource
  7.	Create CSP settings for AWS
  8.	Create an Apex class for creating a record in the object.
  9.	Create a LWC component

1.	Create Amazon Account and S3 bucket – 
The very first step is to create an AWS account (follow this link to create an AWS account). After successful account creation  
  a.	Select the dropdown 'Services' on the left side of the screen.
  b.	Search for S3 in the list.
  c.	Click on create bucket button and create a bucket.
  
2.	Generate access key and secret key id –
Generate access key and secret key for the root user. After generation, you can also download these credentials in an excel file. Keep the generated access key and secret key safe so that it can be used later. Prefer to keep these credentials in an excel file.

3.	Configure Bucket policy –
The requirement of configuring the bucket policy is that the bucket created is accessible for the API calls from other sources.
In bucket policy, we have to put the below code –
    {
        "Version": "2008-10-17",
        "Statement": [
            {
                "Sid": "AllowPublicRead",
                "Effect": "Allow",
                "Principal": {
                    "AWS": "*"
                },
                "Action": "s3:*",
                "Resource": "arn:aws:s3:::bucketname/*"
            }
        ]
    } 

4.	Create a new object in Salesforce© org –
Create a custom object in Salesforce© org to store the records of the documents stored in the S3 bucket. Create an object and create the fields for storing document link on S3 and its fields according to the need like document name, type, etc.

5.	Create metadata for storing credentials –
To connect S3 with LWC there will be a need for the S3 access key and secret key. As the LWC is a javascript framework so the hardcoding the credentials may lead to a security break. For sake of best practice and data security put the S3 credentials in the metadata object.
Create a metadata object in Salesforce© org using the following steps – 
  a.	Goto setup in Salesforce© and search for ‘Custom Metadata Type’.
  b.	Click on 'New Custom Metadata Type' and fill in the information asked.
  c.	After filling, click on the 'save' button.
  d.	After saving click on the label of the newly created Metadata type.
  e.	Go to ‘Custom Fields’ and create new custom fields.
      Create the fields for storing a secret key, access key, bucket name, and region name.
  f.	After creating fields click on the label of the metadata object and click on 'Manage Record'.
  g.	In manage record, the records of the metadata object can be created i.e. S3 credentials.

6.	Add AWS SDK in static resource –
Download the AWS SDK from this link.  After download create a static resource and put the downloaded js file in it.  

7.	Create CSP settings for AWS –
CSP is the Content Security Policy settings are the settings to register Amazon S3 URL as the trusted site. For adding Amazon S3 URL in CSP follow the below steps –
  a.	Goto setup in Salesforce© Org.
  b.	Search for the CSP in the quick search box and click on CSP Trusted Sites.
  c.	Click on the New Trusted Site button and fill the fields and save.
Note: Don't use 'https://*.amazonaws.com'  for any site URL. It is not accepted.

8.	Create an Apex class for creating a record in object –
Now create an apex class for creating a record in Salesforce© org. It will be used for creating the record with the help of LWC.
Inside the class create a method which will take parameters for creating a record and after taking parameters fire a DML for record creation.

9.	Create a LWC component
Now finally, create a LWC component in VS code for taking the file as input. The component code is as per the users requirement. Here is the 
For the code of the component refer to this
