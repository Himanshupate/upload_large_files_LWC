public with sharing class FileUploadController {

    @AuraEnabled
    public static Boolean insertCatalogDocument(Id parentId, String fileName, String fileURL, String documentName, String documentType          ){
        Catalog_Documents__c attachment = new Catalog_Documents__c();
        attachment.Catalog__c = parentId;
        attachment.S3_Server_URL__c = fileURL;
        attachment.File_Name__c =  fileName;
        attachment.Document_Name__c = documentName;
        attachment.Document_Type__c = documentType;
        Catalog__c cat = new Catalog__c();
        cat.Id = parentId;
        if(documentType.equals('Video')) {
            cat.VideoLink__c = fileURL;
        }else {
            cat.PPTLink__c = fileURL;
        }
        insert attachment; 
        update cat;
        return true;
    }
}
