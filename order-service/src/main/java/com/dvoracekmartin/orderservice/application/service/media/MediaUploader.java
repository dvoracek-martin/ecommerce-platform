package com.dvoracekmartin.orderservice.application.service.media;

public interface MediaUploader {
    String uploadBase64(String base64Data, String categoryName, String objectKey, String contentType, String bucketName, String objectName);

    void deleteMedia(String imageUrl);

    void createBucketIfNotExists(String productBucket);
}
