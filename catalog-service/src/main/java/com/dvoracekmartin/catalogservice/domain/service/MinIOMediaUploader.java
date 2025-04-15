package com.dvoracekmartin.catalogservice.domain.service;

import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.*;

import java.net.URI;
import java.util.Base64;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Slf4j
@Component
@RequiredArgsConstructor
public class MinIOMediaUploader {

    @Value("${minio.endpoint}")
    private String minioEndpoint;

    @Value("${minio.access-key}")
    private String accessKey;

    @Value("${minio.secret-key}")
    private String secretKey;

    @Value("${minio.bucket-name}")
    private String bucketName;

    private S3Client s3Client;

    private final MinIOMediaRetriever mediaRetriever;


    @PostConstruct
    private void initializeClient() {
        this.s3Client = S3Client.builder()
                .endpointOverride(URI.create(minioEndpoint))
                .region(Region.US_EAST_1)
                .credentialsProvider(StaticCredentialsProvider.create(
                        AwsBasicCredentials.create(accessKey, secretKey)))
                .forcePathStyle(true)
                .build();

        createBucketIfNotExists();
    }

    public void createBucketIfNotExists() {
        try {
            s3Client.headBucket(HeadBucketRequest.builder().bucket(bucketName).build());
            log.info("Bucket '{}' already exists", bucketName);
        } catch (NoSuchBucketException e) {
            try {
                s3Client.createBucket(b -> b.bucket(bucketName));
                log.info("Created bucket '{}'", bucketName);
            } catch (BucketAlreadyExistsException e2) {
                log.info("Bucket '{}' already exists (race condition)", bucketName);
            }
        }
    }

    public String uploadBase64Image(String base64Image, String objectKey, String contentType) {
        return uploadBase64(base64Image, objectKey, contentType);
    }

    public String uploadBase64Video(String base64Video, String objectKey, String contentType) {
        return uploadBase64(base64Video, objectKey, contentType);
    }

    private String uploadBase64(String base64Data, String objectKey, String contentType) {
        createBucketIfNotExists();

        String folderPath = bucketName + "/" + getBaseNameWithoutExtension(objectKey);
        String baseName = getBaseNameWithoutExtension(objectKey);
        String extension = getExtension(objectKey);
        String finalObjectKey = findUniqueObjectName(folderPath + "/" + baseName, extension);

        try {
            byte[] dataBytes = Base64.getDecoder().decode(base64Data);

            s3Client.putObject(PutObjectRequest.builder()
                            .bucket(bucketName)
                            .key(finalObjectKey)
                            .contentType(contentType)
                            .contentLength((long) dataBytes.length)
                            .build(),
                    RequestBody.fromBytes(dataBytes));

            String publicUrl = s3Client.utilities().getUrl(b -> b
                            .bucket(bucketName)
                            .key(finalObjectKey))
                    .toExternalForm();
            log.info("Uploaded object to: {}", publicUrl);

            // Cache Eviction
            evictRelatedCaches(finalObjectKey);

            return publicUrl;

        } catch (IllegalArgumentException | S3Exception e) {
            log.error("Upload failed: {}", e.getMessage());
            return null;
        }
    }

    private void evictRelatedCaches(String finalObjectKey) {
        // 1. Evict individual media cache
        mediaRetriever.evictMediaCache(finalObjectKey);

        // 2. Evict parent folder listing cache
        String parentFolder = extractParentFolder(finalObjectKey);
        mediaRetriever.evictFolderCache(parentFolder);
    }

    private String extractParentFolder(String objectKey) {
        int lastSlashIndex = objectKey.lastIndexOf('/');
        return (lastSlashIndex > 0) ?
                objectKey.substring(0, lastSlashIndex + 1) :
                "";
    }

    private String findUniqueObjectName(String baseKey, String extension) {
        Pattern pattern = Pattern.compile(Pattern.quote(baseKey) + "-(\\d+)" + Pattern.quote(extension) + "$");
        int maxCounter = 0;

        ListObjectsV2Request listRequest = ListObjectsV2Request.builder()
                .bucket(bucketName)
                .prefix(baseKey)
                .build();

        ListObjectsV2Response listResponse;
        do {
            listResponse = s3Client.listObjectsV2(listRequest);
            for (S3Object s3Object : listResponse.contents()) {
                Matcher matcher = pattern.matcher(s3Object.key());
                if (matcher.find()) {
                    maxCounter = Math.max(maxCounter, Integer.parseInt(matcher.group(1)));
                } else if (s3Object.key().equals(baseKey + extension)) {
                    maxCounter = Math.max(maxCounter, 0);
                }
            }
            listRequest = listRequest.toBuilder().continuationToken(listResponse.nextContinuationToken()).build();
        } while (listResponse.isTruncated());

        String nextName = baseKey + (maxCounter > 0 ? "-" + (maxCounter + 1) : "") + extension;
        if (!doesObjectExist(nextName)) {
            return nextName;
        }

        int counter = maxCounter + 2;
        String uniqueName;
        do {
            uniqueName = baseKey + "-" + counter++ + extension;
        } while (doesObjectExist(uniqueName));
        return uniqueName;
    }

    private boolean doesObjectExist(String key) {
        try {
            s3Client.headObject(HeadObjectRequest.builder()
                    .bucket(bucketName)
                    .key(key)
                    .build());
            return true;
        } catch (NoSuchKeyException e) {
            return false;
        }
    }

    private String getBaseNameWithoutExtension(String objectKey) {
        String fileName = objectKey.substring(objectKey.lastIndexOf('/') + 1);
        int dotIndex = fileName.lastIndexOf('.');
        return dotIndex > 0 ? fileName.substring(0, dotIndex) : fileName;
    }

    private String getExtension(String objectKey) {
        int dotIndex = objectKey.lastIndexOf('.');
        return (dotIndex > 0 && dotIndex < objectKey.length() - 1) ?
                objectKey.substring(dotIndex) : "";
    }
}
