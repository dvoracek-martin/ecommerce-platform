package com.dvoracekmartin.orderservice.application.service.media;

import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
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
@Service
@RequiredArgsConstructor
public class MinIOMediaUploader implements MediaUploader {

    private final MediaRetriever mediaRetriever;
    @Value("${minio.endpoint}")
    private String minioEndpoint;
    @Value("${minio.access-key}")
    private String accessKey;
    @Value("${minio.secret-key}")
    private String secretKey;
    private String bucketName;
    private S3Client s3Client;

    @PostConstruct
    private void initializeClient() {
        this.s3Client = S3Client.builder()
                .endpointOverride(URI.create(minioEndpoint))
                .region(Region.US_EAST_1)
                .credentialsProvider(StaticCredentialsProvider.create(
                        AwsBasicCredentials.create(accessKey, secretKey)))
                .forcePathStyle(true)
                .build();
    }

    @Override
    public void createBucketIfNotExists(String productBucket) {
        this.bucketName = productBucket;
        createBucketIfNotExists();
    }

    private void createBucketIfNotExists() {
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

    public String uploadBase64(String base64Data, String entityId, String objectKey, String contentType, String bucketName, String folderName) {
        this.bucketName = bucketName;
        createBucketIfNotExists();
        String finalObjectKey = findUniqueObjectName(folderName + "/" + objectKey, ".pdf");

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

            evictRelatedCaches(finalObjectKey);

            return publicUrl;

        } catch (IllegalArgumentException | S3Exception e) {
            log.error("Upload failed: {}", e.getMessage());
            return null;
        }
    }

    @Override
    public void deleteMedia(String imageUrl) {
        try {
            URI uri = new URI(imageUrl);
            String path = uri.getPath();

            String[] pathParts = path.substring(1).split("/", 2);

            if (pathParts.length == 2) {
                String bucketName = pathParts[0];
                String objectKey = pathParts[1];

                if (objectKey.startsWith("/")) {
                    objectKey = objectKey.substring(1);
                }

                s3Client.deleteObject(DeleteObjectRequest.builder()
                        .bucket(bucketName)
                        .key(objectKey)
                        .build());
                log.info("Deleted media from bucket '{}' with key '{}'", bucketName, objectKey);
            } else {
                log.error("Could not parse bucket and key from URL path: {}", path);
            }
        } catch (S3Exception e) {
            log.error("Failed to delete media from URL {}: {}", imageUrl, e.getMessage());
        } catch (Exception e) {
            log.error("Failed to parse URL {}: {}", imageUrl, e.getMessage());
        }
    }

    private void evictRelatedCaches(String finalObjectKey) {
        mediaRetriever.evictMediaCache(finalObjectKey);

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
}
