import { LightningElement, track, api, wire } from 'lwc';
import insertCatalogDocument from '@salesforce/apex/FileUploadController.insertCatalogDocument';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { CurrentPageReference } from 'lightning/navigation';
import { NavigationMixin } from 'lightning/navigation';
import getCatalogue from '@salesforce/apex/DigitalCatalog.getCatalogue';
import { loadScript } from "lightning/platformResourceLoader";
import AWS_SDK from '@salesforce/resourceUrl/AWSSDK';
import { getRecord } from "lightning/uiRecordApi";
import {fireEvent} from 'c/pubsub';

export default class UploadDocumentsComponent extends NavigationMixin(LightningElement) {
    @api parentId;
    @wire(CurrentPageReference) pageRef;
    @track selectedCatalogs = [];
    MAX_FILE_SIZE = 209715200;
    file;
    filerestrict;
    fileT;
    myFile
    fileReader;
    fileReaderObj;
    fileContents;
    base64FileData;
    content;
    docType = '';
    docName = '';
    btnDisabled = true;
    awsSettngRecordId;

    @track fileName;
    @track option;
    @track options = ['PPT', 'Video'];
    @track docName;
    @track filesUploaded;
    @track isModalOpen = true;
    @track isLoading = false;
    fileUrl;
    value;
   
    isAwsSdkInitialized = false; //flag to check if AWS SDK initialized

    @wire(getRecord, {
        recordId: "$awsSettngRecordId",
        fields: [
          "AWS_Settings__mdt.S3AccessKey__c",
          "AWS_Settings__mdt.S3BucketName__c",
          "AWS_Settings__mdt.S3RegionName__c",
          "AWS_Settings__mdt.S3SecretKey__c"
        ]
      })
      awsConfigData({ error, data }) {
        if (data) {
          let awsS3MetadataConf = {};
          let currentData = data.fields;
          awsS3MetadataConf = {
            s3bucketName: currentData.S3BucketName__c.value,
            awsAccessKeyId: currentData.S3AccessKey__c.value,
            awsSecretAccessKey: currentData.S3SecretKey__c.value,
            s3RegionName: currentData.S3RegionName__c.value
          };
          this.initializeAwsSdk(awsS3MetadataConf); //Initializing AWS SDK based upon configuration data
        } else if (error) {
          console.error("error ====> " + JSON.stringify(error));
        }
      }

      

    connectedCallback() {
        getCatalogue({ctlgId:this.parentId}).then(response => {
            if (response) {
                const option = {
                    label: response.Name,
                    value: response.Id
                };
                this.selectedCatalogs = [...this.selectedCatalogs, option];
            }
        })
    }
    renderedCallback() {
        if (this.isAwsSdkInitialized) {
            return;
        }
        console.log('Id is-' + this.parentId);
        this.value = this.parentId;
        Promise.all([loadScript(this, AWS_SDK)])
            .then(() => {
                console.log("JS loaded");
                this.awsSettngRecordId = " Id "; // Metadata record id for the credentials
            })
            .catch(error => {
                console.error("error -> " + error);
            });
    }

    @wire(CurrentPageReference) pageRef;

    initializeAwsSdk(confData) {
        const AWS = window.AWS;
        this.fileUrl = 'https://'+confData.s3bucketName +'.s3.'+ confData.s3RegionName +'.amazonaws.com/';
        AWS.config.update({
            accessKeyId: confData.awsAccessKeyId, //Assigning access key id
            secretAccessKey: confData.awsSecretAccessKey, //Assigning secret access key
            httpOptions: {
                timeout: 120000,
                connectTimeout: 120000
            }
        });

        AWS.config.region = confData.s3RegionName; //Assigning region of S3 bucket

        this.s3 = new AWS.S3({
            apiVersion: "2006-03-01",//"2006-03-01",
            params: {
                Bucket: confData.s3bucketName //Assigning S3 bucket name
            }
        });
        this.isAwsSdkInitialized = true;
    }

    selectionChangeHandler(event) {
        this.filesUploaded = null;
        this.fileName = null;
        this.fileT = null;
        this.docType = event.target.value;
        if (this.docType == 'Video') {
            this.filerestrict = 'video/mp4, video/mkv';

        }
        else {
            if (this.docType == 'PPT') {
                this.filerestrict = '.ppt, .pptx, .PPT, .PPTX';

            }
            else {
                this.filerestrict = '';
            }
        }
        this.btnDisabled = true;
        if (this.fileName != null || this.fileName == '') {
            if (this.docType == 'Video' && (this.fileT == '.mp4' || this.fileT == '.mkv')) {
                this.fileName = event.target.files[0].name;

                this.btnDisabled = false;
            } else if (this.docType == 'Video' && (this.fileT != '.mp4' || this.fileT != '.mkv')) {
                this.fileName = 'Supported file type for Videos are .mp4, .mkv';
                this.btnDisabled = true;
            } else if (this.docType == 'PPT' && (this.fileT == '.ppt' || this.fileT == '.pptx' || this.fileT == '.PPTX' || this.fileT == '.PPT')) {
                this.fileName = event.target.files[0].name;
                this.filerestrict = '.ppt, .pptx, .PPT, .PPTX';
                this.btnDisabled = false;
            } else if (this.docType == 'PPT' && (this.fileT != '.ppt' || this.fileT != '.pptx' || this.fileT != '.PPTX' || this.fileT != '.PPT')) {
                this.fileName = 'Supported file type for PPT are .ppt, .pptx,.PPT, .PPTX';
                this.btnDisabled = true;
            } else {
                this.fileName = 'Please select valid file';
            }
        }
        console.log('docType : ' + this.docType);
    }
    handleCatalogChange(event) {
        this.parentId = event.target.value;
        console.log('Id' + this.parentId);
    }
    nameChanged(event) {
        this.docName = event.target.value;
    }

    handleFilesChange(event) {
        this.filesUploaded = event.target.files;
        this.fileName = event.target.files[0].name;
        this.fileT = this.fileName.substring(this.fileName.indexOf('.'));
        console.log('File Type : ' + this.fileT);
        if (this.docType == 'Video' && (this.fileT == '.mp4' || this.fileT == '.mkv')) {
            this.fileName = event.target.files[0].name;
            this.btnDisabled = false;
        } else if (this.docType == 'Video' && (this.fileT != '.mp4' || this.fileT != '.mkv')) {
            this.fileName = 'Supported file type for Videos are .mp4, .mkv';
            this.btnDisabled = true;
        } else if (this.docType == 'PPT' && (this.fileT == '.ppt' || this.fileT == '.pptx' || this.fileT == '.PPTX' || this.fileT == '.PPT')) {
            this.fileName = event.target.files[0].name;
            this.btnDisabled = false;
        } else if (this.docType == 'PPT' && (this.fileT != '.ppt' || this.fileT != '.pptx' || this.fileT != '.PPTX' || this.fileT != '.PPT')) {
            this.fileName = 'Supported file type for PPT are .ppt, .pptx, .PPT, .PPTX';
            this.btnDisabled = true;
        } else {
            this.fileName = 'Please select valid file';
        }
        console.log('File name : ' + event.target.files[0].name);
    }
    handleUpload() {

        if (this.filesUploaded.length > 0) {
            this.uploadToAWS();
            console.log('Handle Upload : ' + this.filesUploaded.length);
        }
        else {
            this.fileName = 'Please select file to upload!!';
        }
    }

    uploadToAWS() {
        this.file = this.filesUploaded[0];
        console.log('Upload to AWS method');
        if (this.file) {
            this.isLoading = true;
            let objKey = this.file.name
                .replace(/\s+/g, "_") //each space character is being replaced with _
                .toLowerCase();
            objKey = this.parentId + objKey;;
            //starting file upload
            this.s3.putObject(
                {
                    Key: objKey,
                    ContentType: this.file.type,
                    Body: this.file,
                    ACL: "public-read"
                },
                err => {
                    if (err) {
                        this.isLoading = false;
                        this.dispatchEvent(
                            new ShowToastEvent({
                                title: 'Error while uploading File on Server',
                                message: 'Timeout Error! Please try with better bandwidth.',
                                variant: 'error',
                            }),
                        );
                    } else {
                        this.isLoading = false;
                        this.fileUrl = this.fileUrl + objKey;
                        insertCatalogDocument({parentId : this.parentId, fileName : objKey, fileURL : this.fileUrl, documentName: this.docName, documentType : this.docType })
                        .then(result =>{
                            if (result) {
                                this.fileName = this.fileName + '  - Uploaded Successfully';
                                this.dispatchEvent(
                                    new ShowToastEvent({
                                        title: 'Success!!',
                                        message: this.fileName,
                                        variant: 'success',
                                    }),
                                );
                                fireEvent(this.pageRef,'showCatalogDetails',false);
                            }
                            
                        })
                        .catch(error =>{
                            this.dispatchEvent(
                                new ShowToastEvent({
                                    title: 'Error while creating the record.',
                                    message: 'REQUIRED FIELDS MISSING',
                                    variant: 'error',
                                }),
                            );
                            this.refershUploadForm();
                        });
                        
                    }
                }
            );
        }

    }

    closeModal() {
        this.isModalOpen = false;
    }
    submitDetails() {
        this.closeModal();
    }
    refershUploadForm() {
        this.parentId = '';
        this.docName = '';
        this.docType = '--None--';
        this.isLoading = false;
        this.btnDisabled = true;
        this.filesUploaded = null;
        this.fileName = '';
    }

}
